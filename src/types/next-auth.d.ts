import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      slug?: string | null;
      username?: string | null;
    } & DefaultSession["user"]
  }
} 