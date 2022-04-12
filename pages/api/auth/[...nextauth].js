import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

const USER_ALLOW_LIST = ["Krzysztof-Cieslak", "dsyme"];

export default NextAuth({
  secret: process.env.NEXT_AUTH_SECRET,
  providers: [
    GithubProvider({
      authorization:
        "https://github.com/login/oauth/authorize?scope=repo,read:user",
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
    async session({ session, token, user }) {
      session.token = token.accessToken;
      return session;
    },
    async signIn({ profile }) {
      const isHubber = profile.site_admin;
      const isGuest = USER_ALLOW_LIST.includes(profile.login);
      return isHubber || isGuest;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
});
