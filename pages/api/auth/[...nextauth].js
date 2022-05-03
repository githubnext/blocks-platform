import axios from "axios";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { GITHUB_STARS } from "../../../lib";

const GUEST_LIST = ["Krzysztof-Cieslak", "dsyme"];

async function refreshAccessToken(token) {
  try {
    const res = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        refresh_token: token.refreshToken,
        grant_type: "refresh_token",
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
      }
    );

    // For whatever reason, res.data is a string (not an object). We can parse it like we would a query param string.
    const parsedResponse = Object.fromEntries(new URLSearchParams(res.data));
    return {
      ...token,
      accessToken: parsedResponse.access_token,
      accessTokenExpiry: Date.now() + parsedResponse.expires_in * 1000,
      refreshToken: parsedResponse.refresh_token,
      refreshTokenExpiry:
        Date.now() + parsedResponse.refresh_token_expires_in * 1000,
    };
  } catch (e) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export default NextAuth({
  secret: process.env.NEXT_AUTH_SECRET,
  providers: [
    GithubProvider({
      authorization: "https://github.com/login/oauth/authorize",
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.login,
          email: profile.email,
          image: profile.avatar_url,
          isHubber: profile.site_admin || GUEST_LIST.includes(profile.login),
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.token = token.accessToken;
      session.user = token.user;
      session.error = token.error;
      return session;
    },
    async signIn({ profile }) {
      const isHubber = profile.site_admin;
      const isGuest = GUEST_LIST.includes(profile.login);
      const isStar = GITHUB_STARS.some((star) => star.id === profile.id);

      return isHubber || isGuest || isStar;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          accessToken: account.access_token,
          // For some reason the date returned here is in seconds, not milliseconds.
          accessTokenExpiry: account.expires_at * 1000,
          refreshToken: account.refresh_token,
          // Refresh tokens are valid for 6 months.
          refreshTokenExpiry:
            Date.now() + account.refresh_token_expires_in * 1000,
          user,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpiry) {
        return token;
      }

      return await refreshAccessToken(token);
    },
  },
});
