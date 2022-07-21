import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import { AppContextValue, AppContext, Permissions } from "context";
import {
  getOwnerRepoFromDevServer,
  getRepoInfoWithContributorsSSR,
  makeGitHubAPIInstance,
  makeOctokitInstance,
} from "ghapi";
import { useCheckRepoAccess } from "hooks";
import { QueryKeyMap } from "lib/query-keys";
import { GetServerSidePropsContext } from "next";
import getConfig from "next/config";
import { getSession, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getUserInstallationForRepo } from "pages/api/check-access";
import { useEffect, useState } from "react";
import { dehydrate, QueryClient, useQueryClient } from "react-query";

const { publicRuntimeConfig } = getConfig();

function RepoDetailContainer({
  hasRepoInstallation,
  permissions,
  installationUrl,
  devServerInfo,
}: AppContextValue) {
  const router = useRouter();
  const [localHasRepoInstallation, setLocalHasRepoInstallation] =
    useState(hasRepoInstallation);
  const { repo, owner, branch, path } = router.query as Record<string, string>;
  const [loaded, setLoaded] = useState(false);

  const queryClient = useQueryClient();
  const { data: session, status } = useSession({
    required: true,
  });

  useEffect(() => {
    if (status === "authenticated" && session.error) {
      signOut();
    }
  }, [session, status]);

  useEffect(() => {
    if (status !== "authenticated" || loaded) return;

    let meta = {
      token: session?.token,
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

    setLoaded(true);
  }, [status]);

  if (status === "loading") {
    return <FullPageLoader />;
  }

  if (status === "authenticated" && session && loaded) {
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
            hasRepoInstallation: localHasRepoInstallation,
            installationUrl,
            permissions,
            devServerInfo,
          }}
        >
          {!localHasRepoInstallation && (
            <CheckAccess
              repo={repo}
              owner={owner}
              onHasRepoSuccess={() => setLocalHasRepoInstallation(true)}
            />
          )}
          {/* @ts-ignore */}
          <RepoDetail token={session?.token} />
        </AppContext.Provider>
      </>
    );
  }

  // TODO: Handle errors here
  return null;
}

export default RepoDetailContainer;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const query = context.query as Record<string, string>;
  const { repo, owner, devServer } = query;
  const queryClient = new QueryClient();
  const session = await getSession({ req: context.req });

  const octokit = makeOctokitInstance(session?.token as string);

  // get the installation for the repo, if the user has access
  const repoInstallation = await getUserInstallationForRepo({
    token: session?.token as string,
    owner,
    repo,
  });

  let repoInfo;
  try {
    // check to see if the user has access to the repo
    const repoRes = await octokit.repos.get({
      owner,
      repo,
    });

    repoInfo = repoRes.data;
  } catch {}

  if (!repoInfo) {
    return {
      redirect: {
        destination: `/no-access?owner=${owner}&repo=${repo}&reason=repo-not-installed`,
        permanent: false,
      },
    };
  }

  await queryClient.prefetchQuery(
    QueryKeyMap.info.factory({ owner, repo }),
    () =>
      getRepoInfoWithContributorsSSR({
        owner,
        repo,
        token: session?.token as string,
      })
  );

  const installationUrl = `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`;

  const permissions = repoInfo.permissions;

  let devServerInfo: DevServerInfo;
  if (devServer) {
    try {
      const { owner, repo } = await getOwnerRepoFromDevServer(devServer);
      const repoRes = await octokit.repos.get({ owner, repo });
      devServerInfo = { devServer, owner, repo, repoInfo: repoRes.data };
    } catch {}
  }

  const isDev = process.env.NODE_ENV !== "production";

  const frameSrc = [
    "frame-src",
    publicRuntimeConfig.sandboxDomain,
    devServerInfo?.devServer,
  ]
    .filter(Boolean)
    .join(" ");

  const connectSrc = [
    "connect-src",
    "'self'",
    // for local dev
    isDev && "webpack://*",
    isDev && "ws://*",
    // for hitting the GitHub API
    "https://api.github.com/",
    // for Analytics
    "https://octo-metrics.azurewebsites.net/api/CaptureEvent",
    devServerInfo?.devServer,
  ]
    .filter(Boolean)
    .join(" ");

  context.res.setHeader(
    "Content-Security-Policy",
    [context.res.getHeader("Content-Security-Policy"), frameSrc, connectSrc]
      .filter(Boolean)
      .join(";")
  );

  return {
    props: {
      hasRepoInstallation: !!repoInstallation,
      permissions,
      installationUrl,
      dehydratedState: dehydrate(queryClient),
      ...(devServerInfo ? { devServerInfo } : {}),
    },
  };
}

const CheckAccess = ({
  repo,
  owner,
  onHasRepoSuccess,
}: {
  repo: string;
  owner: string;
  onHasRepoSuccess: () => void;
}) => {
  useCheckRepoAccess(
    { repo, owner },
    {
      onSuccess: (hasAccess) => {
        if (hasAccess) {
          onHasRepoSuccess();
        }
      },
    }
  );
  return null;
};
