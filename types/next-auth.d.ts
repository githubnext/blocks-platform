import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    error?: string;
    user: {
      name: string;
      email: string;
      image: string;
      isHubber: boolean;
      id: number;
    };
  }
}
