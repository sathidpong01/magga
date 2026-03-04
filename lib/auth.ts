import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, username } from "better-auth/plugins";
import prisma from "./prisma";
import { randomUUID } from "crypto";

export const auth = betterAuth({
  appName: "Magga",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    process.env.BETTER_AUTH_URL || "",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ].filter(Boolean),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    admin(),
    username(),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      username: {
        type: "string",
        required: false,
        unique: true,
      },
      banReason: {
        type: "string",
        required: false,
      },
      bannedAt: {
        type: "date",
        required: false,
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    generateId: () => randomUUID(),
  },
  session: {
    expiresIn: 3 * 24 * 60 * 60, // 3 days
    updateAge: 24 * 60 * 60,      // refresh every 24h
  },
});

export type Session = typeof auth.$Infer.Session;
