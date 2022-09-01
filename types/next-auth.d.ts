import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

type SessionUser = {
  name: string;
  email: string;
  image: string;
  isHubber: boolean;
  id: number;
};

declare module "next-auth/jwt" {
  interface JWT {
    user: SessionUser;
    error?: string;
    accessToken: string;
    accessTokenExpiry: number;
    refreshToken: string;
    refreshTokenExpiry: number;
  }
}

declare module "next-auth" {
  interface Profile {
    login: string;
    site_admin: boolean;
  }

  interface Account {
    access_token: string;
    expires_at: number;
    refresh_token: string;
    refresh_token_expires_in: number;
  }

  interface Session {
    error?: string;
    user: SessionUser;
  }
}
