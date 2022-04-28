import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import { AppContext } from "context";
import {
  getRepoInfoWithContributorsSSR,
  makeGitHubAPIInstance,
  makeOctokitInstance,
} from "ghapi";
import { useCheckRepoAccess } from "hooks";
import { QueryKeyMap } from "lib/query-keys";
import { GetServerSidePropsContext } from "next";
import { getSession, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { getUserInstallationForRepo } from "pages/api/check-access";
import { useEffect, useState } from "react";
import { dehydrate, QueryClient, useQueryClient } from "react-query";

function RepoDetailContainer(props: {
  hasRepoInstallation: boolean;
  installationUrl: string;
}) {
  const { hasRepoInstallation, installationUrl } = props;
  const router = useRouter();
  const [localHasRepoInstallation, setLocalHasRepoInstallation] =
    useState(hasRepoInstallation);
  const { repo, owner } = router.query as Record<string, string>;
  const [loaded, setLoaded] = useState(false);

  const queryClient = useQueryClient();
  const { data: session, status } = useSession({
    required: true,
  });

  useCheckRepoAccess(
    { repo, owner },
    {
      enabled: !localHasRepoInstallation,
      onSuccess: (hasAccess) => {
        if (hasAccess) {
          setLocalHasRepoInstallation(true);
        }
      },
    }
  );

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
      <AppContext.Provider
        value={{ hasRepoInstallation: localHasRepoInstallation }}
      >
        {/* @ts-ignore */}
        <RepoDetail token={session?.token} installationUrl={installationUrl} />
      </AppContext.Provider>
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

  // First, check if the user is authenticated.
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const octokit = makeOctokitInstance(session?.token as string);

  // validate the token
  try {
    octokit.users.getAuthenticated();
  } catch (e) {
    signOut();
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

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

  return {
    props: {
      hasRepoInstallation: !!repoInstallation,
      installationUrl,
      dehydratedState: dehydrate(queryClient),
    },
  };
}
