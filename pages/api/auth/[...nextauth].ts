import { jwtDecrypt } from "jose";
import type { NextApiRequest } from "next";
import axios from "axios";
import hkdf from "@panva/hkdf";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { GITHUB_STARS } from "../../../lib";

const GUEST_LIST_INTERNAL = ["Krzysztof-Cieslak", "dsyme"];
const GUEST_LIST_EXTERNAL = ["dmalan", ...GITHUB_STARS.map((d) => d.username)];

async function fetchPublicToken(accessToken: string) {
  try {
    const res = await axios.post(
      `https://api.github.com/applications/${process.env.GITHUB_ID}/token/scoped`,
      {
        access_token: accessToken,
        // we need to give a target that has the app installed
        // but we don't give any repos or permissions
        target: "githubnext",
        permissions: {
          metadata: "read",
        },
      },
      {
        headers: {
          Accept: "application/json",
        },
        auth: {
          username: process.env.GITHUB_ID,
          password: process.env.GITHUB_SECRET,
        },
      }
    );
    return res.data.token;
  } catch (e) {
    console.log(e.message);
  }
}

async function refreshAccessToken(token) {
  try {
    const res = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        refresh_token: token.refreshToken,
        grant_type: "refresh_token",
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const parsedResponse = res.data;

    // Sometimes we might get a 200 response but an error message such as "bad_verification_code"
    if (parsedResponse.error) {
      throw new Error(parsedResponse.error);
    }

    const publicToken = fetchPublicToken(parsedResponse.access_token);

    return {
      ...token,
      accessToken: parsedResponse.access_token,
      accessTokenExpiry: Date.now() + parsedResponse.expires_in * 1000,
      refreshToken: parsedResponse.refresh_token,
      refreshTokenExpiry:
        Date.now() + parsedResponse.refresh_token_expires_in * 1000,
      publicToken,
    };
  } catch (e) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GithubProvider({
      authorization: "https://github.com/login/oauth/authorize",
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.login,
          email: profile.email,
          image: profile.avatar_url,
          isHubber:
            profile.site_admin || GUEST_LIST_INTERNAL.includes(profile.login),
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.token = token.accessToken;
      session.publicToken = token.publicToken;
      session.user = token.user;
      session.error = token.error;
      return session;
    },
    async signIn({ profile }) {
      const isHubber = profile.site_admin;
      const isGuest =
        GUEST_LIST_INTERNAL.includes(profile.login) ||
        GUEST_LIST_EXTERNAL.includes(profile.login);

      return isHubber || isGuest;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        const publicToken = await fetchPublicToken(account.access_token);

        return {
          accessToken: account.access_token,
          // For some reason the date returned here is in seconds, not milliseconds.
          accessTokenExpiry: account.expires_at * 1000,
          refreshToken: account.refresh_token,
          // Refresh tokens are valid for 6 months.
          refreshTokenExpiry:
            Date.now() + account.refresh_token_expires_in * 1000,
          user,
          publicToken,
        };
      }

      // refresh token if it will expire in the next 15 minutes
      // `jwt` runs every 5 minutes when the client refreshes the session
      if (Date.now() > token.accessTokenExpiry - 900) {
        return await refreshAccessToken(token);
      } else {
        return token;
      }
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // replace origin with baseUrl
      // to fix bonkers behavior from next-auth
      // fix in the works: https://github.com/nextauthjs/next-auth/pull/4534
      const origin = baseUrl;
      const urlPath = new URL(url).pathname;
      const searchParams = new URL(url).searchParams.toString();
      const newPath = `${origin}${urlPath}?${searchParams}`;
      return newPath;
    },
  },
};
export default NextAuth(authOptions);

// get session by unpacking the NextAuth cookie without attempting to refresh the GitHub token
export const getSessionOnServer = async (req: NextApiRequest): Promise<any> => {
  const secret = authOptions.secret;
  if (!secret) {
    throw new Error("Secret is not defined");
  }
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";
  const cookieValue = req.cookies[cookieName];

  // see https://github.com/nextauthjs/next-auth/blob/main/packages/next-auth/src/jwt/index.ts#L29
  const encryptionSecret = await getDerivedEncryptionKey(secret);
  const { payload } = await jwtDecrypt(cookieValue, encryptionSecret, {
    clockTolerance: 15,
  });

  const parsedPayload = authOptions.callbacks.session({
    session: {},
    token: payload,
  });
  return parsedPayload;
};

async function getDerivedEncryptionKey(secret: string | Buffer) {
  return await hkdf(
    "sha256",
    secret,
    "",
    "NextAuth.js Generated Encryption Key",
    32
  );
}
