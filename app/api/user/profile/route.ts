import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserBanned } from "@/lib/session-utils";
import { db } from "@/db";
import { profiles as usersTable } from "@/db/schema";
import { eq, or, and, ne } from "drizzle-orm";
import { z } from "zod";

const profileSchema = z.object({
  name: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(2, "Name must be at least 2 characters").optional()
  ),
  username: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(3, "Username must be at least 3 characters").optional()
  ),
  email: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().email("Invalid email address").optional()
  ),
  commentPreference: z.enum(["sidebar", "bottom", "both", "none"]).optional(),
});

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isUserBanned(session)) {
      return NextResponse.json(
        { error: "บัญชีของคุณถูกระงับการใช้งาน" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, username, email, commentPreference } = profileSchema.parse(body);

    // Check if username or email is already taken by ANOTHER user
    if (username || email) {
      const orConditions = [];
      if (username) orConditions.push(eq(usersTable.username, username));
      if (email) orConditions.push(eq(usersTable.email, email));

      if (orConditions.length > 0) {
        const existingUser = await db.query.profiles.findFirst({
          where: and(
            ne(usersTable.id, session.user.id),
            or(...orConditions)
          ),
        });

        if (existingUser) {
          if (username && existingUser.username === username) {
            return NextResponse.json(
              { error: "Username is already taken" },
              { status: 400 }
            );
          }
          if (email && existingUser.email === email) {
            return NextResponse.json(
              { error: "Email is already taken" },
              { status: 400 }
            );
          }
        }
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (commentPreference) updateData.commentPreference = commentPreference;

    let user;
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      const [updated] = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, session.user.id))
        .returning();
      user = updated;
    } else {
      user = await db.query.profiles.findFirst({
        where: eq(usersTable.id, session.user.id),
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        image: user.image,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0].message },
        { status: 400 }
      );
    }
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
