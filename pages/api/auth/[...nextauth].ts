import { jwtDecrypt } from "jose";
import type { NextApiRequest } from "next";
import axios from "axios";
import hkdf from "@panva/hkdf";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { GITHUB_STARS } from "../../../lib";

const GUEST_LIST_INTERNAL = ["Krzysztof-Cieslak", "dsyme"];
const GUEST_LIST_EXTERNAL = ["dmalan", ...GITHUB_STARS.map((d) => d.username)];

type User = {
  id: string;
  name: string;
  email: string;
  image: string;
  isHubber: boolean;
};

type Account = {
  access_token: string;
  expires_at: number;
  refresh_token: string;
  refresh_token_expires_in: number;
};

type Token = {
  accessToken: string;
  accessTokenExpiry: number;
  refreshToken: string;
  refreshTokenExpiry: number;
  user: User;
  publicToken: string;
  hasAccess: boolean;
  hasAccessExpiry: number;
  error?: string;
};

type Session = {
  userToken?: string;
  token?: string;
  user?: User;
  hasAccess?: boolean;
  error?: string;
};

async function fetchHasAccess({
  login,
  accessToken,
}: {
  login: string;
  accessToken: string;
}): Promise<boolean> {
  if (
    GUEST_LIST_INTERNAL.includes(login) ||
    GUEST_LIST_EXTERNAL.includes(login)
  ) {
    return true;
  } else {
    const res = await fetch(
      process.env.NEXT_PUBLIC_FUNCTIONS_URL +
        `/api/verify?project=blocks&token=${accessToken}`
    );
    const json = await res.json();
    return json.hasAccess;
  }
}

async function fetchPublicToken(accessToken: string): Promise<string> {
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
    if (typeof res.data.token !== "string") {
      console.log(`invalid public token ${JSON.stringify(res.data.token)}`);
    }
    return res.data.token;
  } catch (e) {
    console.log(e.message);
  }
}

async function refreshAccessToken(token: Token): Promise<Token> {
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

    const publicToken = await fetchPublicToken(parsedResponse.access_token);

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

async function refreshHasAccess(token: Token): Promise<Token> {
  try {
    const hasAccess = await fetchHasAccess({
      login: token.user.name,
      accessToken: token.accessToken,
    });
    return {
      ...token,
      hasAccess,
      hasAccessExpiry: Date.now() + 5 * 60 * 1000,
    };
  } catch (e) {
    return token;
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
        const user: User = {
          id: String(profile.id),
          name: profile.login,
          email: profile.email,
          image: profile.avatar_url,
          isHubber:
            profile.site_admin || GUEST_LIST_INTERNAL.includes(profile.login),
        };
        return user;
      },
    }),
  ],
  callbacks: {
    async session({
      session,
      token,
    }: {
      session: Session;
      token: Token;
    }): Promise<Session> {
      session.userToken = token.accessToken;
      session.token = token.publicToken;
      session.user = token.user;
      session.error = token.error;
      session.hasAccess = token.hasAccess;
      return session;
    },
    async jwt({
      token,
      account,
      user,
    }: {
      token: Token;
      account?: Account;
      user?: User;
    }): Promise<Token> {
      const now = Date.now();

      if (account && user) {
        const [publicToken, hasAccess] = await Promise.all([
          fetchPublicToken(account.access_token),
          fetchHasAccess({
            login: user.name,
            accessToken: account.access_token,
          }),
        ]);

        return {
          accessToken: account.access_token,
          // For some reason the date returned here is in seconds, not milliseconds.
          // refresh token if it will expire in the next 15 minutes
          // `jwt` runs every 5 minutes when the client refreshes the session
          accessTokenExpiry: (account.expires_at - 15 * 60) * 1000,
          refreshToken: account.refresh_token,
          // Refresh tokens are valid for 6 months.
          refreshTokenExpiry: now + account.refresh_token_expires_in * 1000,
          user,
          publicToken,
          hasAccess,
          hasAccessExpiry: now + 5 * 60 * 1000,
        };
      }

      if (
        !token.hasAccessExpiry || // upgrade old sessions
        now > token.hasAccessExpiry
      ) {
        return await refreshHasAccess(token);
      } else if (now > token.accessTokenExpiry) {
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
// there's no way to parameterize NextAuth with the types we actually use for
// Token, Account, User, Session
// @ts-ignore
export default NextAuth(authOptions);

// get session by unpacking the NextAuth cookie without attempting to refresh the GitHub token
export const getSessionOnServer = async (req: {
  cookies: NextApiRequest["cookies"];
}): Promise<Session> => {
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
    token: payload as Token,
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
