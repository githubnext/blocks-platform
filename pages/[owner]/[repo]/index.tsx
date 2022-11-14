import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import { AppContext, AppContextValue } from "context";
import {
  getOwnerRepoFromDevServer,
  makeGitHubAPIInstance,
  makeOctokitInstance,
} from "ghapi";
import { useCheckRepoAccess, useRepoInfo } from "hooks";
import { GetServerSidePropsContext } from "next";
import { signOut, useSession } from "next-auth/react";
import getConfig from "next/config";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { getSessionOnServer } from "pages/api/auth/[...nextauth]";

const { publicRuntimeConfig } = getConfig();

function RepoDetailContainer({ installationUrl }: AppContextValue) {
  const router = useRouter();
  const [hasRepoInstallation, setHasRepoInstallation] = useState(false);
  const { repo, owner, branch, path, devServer } = router.query as Record<
    string,
    string
  >;
  const [devServerInfoLoaded, setDevServerInfoLoaded] = useState(false);
  const [devServerInfo, setDevServerInfo] = useState<undefined | DevServerInfo>(
    undefined
  );
  const [queryClientMetaLoaded, setQueryClientMetaLoaded] = useState(false);

  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const isAuthenticated = sessionStatus === "authenticated";

  useEffect(() => {
    if (
      isAuthenticated &&
      // somehow some extant sessions have token === {}, sign out if so
      (session.error || typeof session.token !== "string")
    ) {
      console.log(`invalid session ${JSON.stringify(session)}`);
      signOut();
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const meta = {
      token: session?.token,
      userToken: session?.userToken,
      ghapi: makeGitHubAPIInstance(session?.token as string),
      octokit: makeOctokitInstance(session?.token as string),
      user: session?.user,
      queryClient,
    };

    queryClient.setDefaultOptions({
      queries: {
        meta,
      },
    });
    setQueryClientMetaLoaded(true);
  }, [sessionStatus]);

  useEffect(() => {
    const devServerInfoPromise = /^http:\/\/localhost:[0-9]+\//.test(devServer)
      ? getOwnerRepoFromDevServer(devServer)
          .then(({ owner, repo }) => ({ devServer, owner, repo }))
          .catch(() => undefined)
      : Promise.resolve(undefined);

    devServerInfoPromise.then((devServerInfo) => {
      setDevServerInfo(devServerInfo);
      setDevServerInfoLoaded(true);
    });
  }, [devServer, owner, repo]);

  useCheckRepoAccess(
    { repo, owner },
    {
      enabled: isAuthenticated && !hasRepoInstallation,
      onSuccess: (hasAccess) => setHasRepoInstallation(hasAccess),
    }
  );

  const { data: repoInfo, status: repoInfoStatus } = useRepoInfo(
    { owner, repo },
    { enabled: queryClientMetaLoaded }
  );
  if (repoInfoStatus === "error" || repoInfo?.private) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h3 className="font-bold text-lg">
            We weren't able to find the{" "}
            <strong>
              {owner}/{repo}
            </strong>{" "}
            repo.
          </h3>
          <h3>Blocks doesn't work with private repos.</h3>
        </div>
      </div>
    );
  }

  if (
    sessionStatus === "loading" ||
    repoInfoStatus !== "success" ||
    !devServerInfoLoaded ||
    !queryClientMetaLoaded
  ) {
    return <FullPageLoader />;
  }

  return (
    <>
      <Head>
        <title>
          {/* mimicking github.com's title */}
          GitHub Blocks:
          {path ? ` ${repo}/${path}` : ` ${repo}`}
          {branch ? ` at ${branch}` : ""}
          {` · ${owner}/${repo}`}
        </title>
      </Head>
      <AppContext.Provider
        value={{
          hasRepoInstallation: hasRepoInstallation,
          installationUrl,
          permissions: repoInfo.permissions,
          devServerInfo,
        }}
      >
        <RepoDetail />
      </AppContext.Provider>
    </>
  );
}

export default RepoDetailContainer;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSessionOnServer(context.req);
  if (!session.hasAccess) {
    return {
      redirect: {
        destination: "/signup",
        permanent: false,
      },
    };
  }

  const query = context.query as Record<string, string>;
  const { devServer } = query;

  const isDev = process.env.NODE_ENV !== "production";

  const frameSrc = ["frame-src", publicRuntimeConfig.sandboxDomain, devServer]
    .filter(Boolean)
    .join(" ");

  const connectSrc = [
    "connect-src",
    "'self'",
    // for local dev
    isDev && "webpack://*",
    isDev && "ws://*",
    // for access checking
    process.env.NEXT_PUBLIC_FUNCTIONS_URL,
    // for hitting the GitHub API
    "https://api.github.com/",
    // for Analytics
    "https://octo-metrics.azurewebsites.net/api/CaptureEvent",
    "https://eastus-8.in.applicationinsights.azure.com/",
    devServer,
  ]
    .filter(Boolean)
    .join(" ");

  context.res.setHeader(
    "Content-Security-Policy",
    [context.res.getHeader("Content-Security-Policy"), frameSrc, connectSrc]
      .filter(Boolean)
      .join(";")
  );

  const installationUrl = `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`;

  return {
    props: {
      installationUrl,
    },
  };
}
