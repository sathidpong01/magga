import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isBanned: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    isBanned?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: string;
    isBanned: boolean;
  }
}
