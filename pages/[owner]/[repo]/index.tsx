import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import {
  getRepoInfoWithContributorsSSR,
  makeGitHubAPIInstance,
  makeOctokitInstance,
} from "ghapi";
import { QueryKeyMap } from "lib/query-keys";
import { GetServerSidePropsContext } from "next";
import { getSession, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { dehydrate, QueryClient, useQueryClient } from "react-query";

function RepoDetailContainer() {
  const [loaded, setLoaded] = useState(false);

  const queryClient = useQueryClient();
  const { data: session, status } = useSession({
    required: true,
  });

  useEffect(() => {
    if (status !== "authenticated" || loaded) return;

    let meta = {
      token: session?.token,
      ghapi: makeGitHubAPIInstance(session?.token),
      octokit: makeOctokitInstance(session?.token),
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
    // @ts-ignore
    return <RepoDetail token={session?.token} />;
  }

  // TODO: Handle errors here
  return null;
}

export default RepoDetailContainer;

const NO_ACCESS_REDIRECT = ({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) => ({
  redirect: {
    destination: `/no-access?owner=${owner}&repo=${repo}`,
    permanent: false,
  },
});

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

  const octokit = makeOctokitInstance(session.token);

  // Next, check whether the user (and by extension, the GitHub App) has access to the repo.
  try {
    // Is this a reliable way to determine if the app is authenticated for the given repo?
    // Do we need to use "octokit.rest.apps.getRepoInstallation" instead?
    await octokit.repos.get({ owner, repo });
  } catch (e) {
    return NO_ACCESS_REDIRECT({ repo, owner });
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

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}
