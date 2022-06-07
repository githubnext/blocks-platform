import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import { AppContext, Permissions } from "context";
import {
  getRepoInfoWithContributorsSSR,
  makeGitHubAPIInstance,
  makeOctokitInstance,
} from "ghapi";
import { useCheckRepoAccess } from "hooks";
import { QueryKeyMap } from "lib/query-keys";
import { GetServerSidePropsContext } from "next";
import { getSession, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getUserInstallationForRepo } from "pages/api/check-access";
import { useEffect, useState } from "react";
import { dehydrate, QueryClient, useQueryClient } from "react-query";

function RepoDetailContainer(props: {
  hasRepoInstallation: boolean;
  installationUrl: string;
  permissions: Permissions;
}) {
  const { hasRepoInstallation, permissions, installationUrl } = props;
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
  const query = context.query;
  const { repo, owner } = query as Record<string, string>;
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

  return {
    props: {
      hasRepoInstallation: !!repoInstallation,
      permissions,
      installationUrl,
      dehydratedState: dehydrate(queryClient),
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
