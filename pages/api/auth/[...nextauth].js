import axios from "axios";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

const USER_ALLOW_LIST = ["Krzysztof-Cieslak", "dsyme"];

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

    const refreshedToken = res.data;
    return {
      ...token,
      accessToken: refreshedToken.access_token,
      accessTokenExpiry: refreshedToken.expires_at,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
      refreshTokenExpiry: Date.now() + account.refresh_token_expires_in * 1000,
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
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.token = token.accessToken;
      return session;
    },
    async signIn({ profile }) {
      const isHubber = profile.site_admin;
      const isGuest = USER_ALLOW_LIST.includes(profile.login);
      return isHubber || isGuest;
    },
    async jwt({ token, account, user }) {
      // Only runs on initial sign in
      if (account && user) {
        return {
          accessToken: account.access_token,
          // For some reason this date is in seconds, not milliseconds? Not sure if I'm seeing something silly on my end.
          accessTokenExpiry: account.expires_at * 1000,
          refreshToken: account.refresh_token,
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
