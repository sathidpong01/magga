import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
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
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, username, email } = profileSchema.parse(body);

    // Check if username or email is already taken by ANOTHER user
    if (username || email) {
      const orConditions = [];
      if (username) orConditions.push({ username });
      if (email) orConditions.push({ email });

      if (orConditions.length > 0) {
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { NOT: { email: session.user.email } }, // Not current user
              { OR: orConditions }
            ]
          }
        });

        if (existingUser) {
          if (username && existingUser.username === username) {
            return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
          }
          if (email && existingUser.email === email) {
            return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
          }
        }
      }
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        ...(name && { name }),
        ...(username && { username }),
        ...(email && { email }),
      },
    });

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
        { error: (error as any).errors?.[0]?.message || "Validation error" },
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
