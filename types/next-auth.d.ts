import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      banned: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    banned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    banned: boolean;
  }
}
