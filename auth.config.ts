import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

async function checkLoginRateLimit(
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetTime?: number }> {
  const now = new Date();

  const attempt = await prisma.loginAttempt.findUnique({
    where: { identifier },
  });

  if (!attempt || now > attempt.expiresAt) {
    // Reset or first attempt
    await prisma.loginAttempt.upsert({
      where: { identifier },
      update: {
        count: 1,
        expiresAt: new Date(now.getTime() + LOCKOUT_DURATION),
      },
      create: {
        identifier,
        count: 1,
        expiresAt: new Date(now.getTime() + LOCKOUT_DURATION),
      },
    });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: attempt.expiresAt.getTime(),
    };
  }

  // Increment
  await prisma.loginAttempt.update({
    where: { identifier },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, remaining: MAX_ATTEMPTS - (attempt.count + 1) };
}

async function clearAttempt(identifier: string) {
  await prisma.loginAttempt.delete({ where: { identifier } }).catch(() => {});
}

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || (() => {
        console.error("Missing GOOGLE_CLIENT_ID");
        return "";
      })(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || (() => {
        console.error("Missing GOOGLE_CLIENT_SECRET");
        return "";
      })(),
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        // Rate limiting by username + IP
        const headersList = await headers();
        const clientIP =
          headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          headersList.get("x-real-ip") ||
          headersList.get("cf-connecting-ip") ||
          "unknown";
        const identifier = `login:${username.toLowerCase()}:${clientIP}`;
        const rateCheck = await checkLoginRateLimit(identifier);

        if (!rateCheck.allowed) {
          const minutesLeft = Math.ceil(
            (rateCheck.resetTime! - Date.now()) / 60000
          );
          throw new Error(
            `Too many login attempts. Please try again in ${minutesLeft} minute${
              minutesLeft > 1 ? "s" : ""
            }.`
          );
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: username },
              { email: username },
            ],
          },
        });

        if (!user || !user.password) {
          throw new Error(
            `Invalid username or password. ${rateCheck.remaining} attempt${
              rateCheck.remaining !== 1 ? "s" : ""
            } remaining.`
          );
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          throw new Error(
            `Invalid username or password. ${rateCheck.remaining} attempt${
              rateCheck.remaining !== 1 ? "s" : ""
            } remaining.`
          );
        }

        // Clear attempts on successful login
        await clearAttempt(identifier);

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          isBanned: user.isBanned,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, // 3 days in seconds
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign in
      if (user) {
        token.id = user.id;
        token.role = ((user as any).role || "user").toUpperCase();
        token.isBanned = (user as any).isBanned || false;
      }

      // Handle session update
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }

      return token;
    },
    async signIn() {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If url is relative, make it absolute
      if (url.startsWith("/")) url = `${baseUrl}${url}`;

      // If redirecting to baseUrl or signin, go to dashboard
      if (url === baseUrl || url.includes("/auth/signin")) {
        return `${baseUrl}/dashboard`;
      }

      // If URL is on same site, allow it
      if (url.startsWith(baseUrl)) return url;

      // Otherwise, go to dashboard
      return `${baseUrl}/dashboard`;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // ตรวจสอบว่า user ยังมีอยู่ใน database หรือไม่ และดึงข้อมูลเพิ่มเติม
        const userExists = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            role: true,
            name: true,
            username: true,
            image: true,
            isBanned: true,
          },
        });

        if (!userExists) {
          console.warn(
            `User ${token.id} not found in database, invalidating session`
          );
          return { ...session, user: undefined };
        }

        session.user.id = userExists.id;
        session.user.role = (userExists.role || "user").toUpperCase();
        session.user.isBanned = userExists.isBanned || false;
        // เพิ่มข้อมูล profile
        session.user.name = userExists.name || userExists.username || null;
        session.user.image = userExists.image || null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
