import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles as usersTable, accounts as accountsTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { validatePassword } from "@/lib/password-validation";
import { checkRateLimit } from "@/lib/rate-limit";

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().superRefine((pwd, ctx) => {
    const result = validatePassword(pwd);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.errors[0] || "Password is too weak",
      });
    }
  }),
});

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 3 password changes per hour per user
    const limitCheck = await checkRateLimit(
      `password:${session.user.email}`,
      3, // 3 attempts
      60 * 60 * 1000 // per hour
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Too many password change attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = passwordSchema.parse(body);

    const user = await db.query.profiles.findFirst({
      where: eq(usersTable.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has an existing credentials account in the accounts table
    const hasCredentialAccount = await db.query.accounts.findFirst({
      where: and(
        eq(accountsTable.userId, user.id),
        eq(accountsTable.providerId, "credential")
      ),
    });

    if (hasCredentialAccount) {
      // User has a credentials account -> use changePassword which verifies current password automatically
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }

      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
        headers: req.headers,
      });
    } else {
      // User does NOT have a credentials account (e.g. registered via Google OAuth)
      // For security, if they already set a password in profiles.password (via the bugged API previously),
      // we must verify their current password first using bcrypt.compare.
      if (user.password) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required" },
            { status: 400 }
          );
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
          return NextResponse.json(
            { error: "Incorrect current password" },
            { status: 400 }
          );
        }
      }

      // Link credentials account by setting password for the first time
      await auth.api.setPassword({
        body: {
          newPassword,
        },
        headers: req.headers,
      });
    }

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0].message },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}

