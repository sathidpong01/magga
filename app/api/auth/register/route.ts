import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { validatePassword } from "@/lib/password-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { validatePasswordStrength } from "@/lib/validation";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().superRefine((pwd, ctx) => {
    const result = validatePassword(pwd);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.errors[0] || "Password is too weak",
      });
    }
  }),
});

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 registrations per day per IP
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const limitCheck = await checkRateLimit(
      `register:${ip}`,
      5, // 5 registrations
      24 * 60 * 60 * 1000 // per 24 hours
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Registration limit reached. Please try again tomorrow." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, email, password } = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: "user", // Default role
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as z.ZodError).issues[0].message },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
