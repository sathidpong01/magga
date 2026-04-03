import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import { db, schema } from "@/db";
import { randomUUID } from "crypto";
import { getAuthBaseUrl, getTrustedOrigins } from "@/lib/site-url";

export const auth = betterAuth({
  appName: "Magga",
  baseURL: getAuthBaseUrl(),
  trustedOrigins: getTrustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.profiles,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verification
    }
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
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
  },
  account: {
    storeStateStrategy: "cookie",
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      banned: {
        type: "boolean",
        defaultValue: false,
        required: false,
      },
      isBanned: {
        type: "boolean",
        defaultValue: false,
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
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — short enough to pick up bans/role changes
    },
  },
});

export type Session = typeof auth.$Infer.Session;
