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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const query = context.query;
  const { repo, owner } = query as Record<string, string>;
  const queryClient = new QueryClient();
  const session = await getSession({ req: context.req });

  if (!session) {
    return {
      redirect: {
        destination: "/",
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

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}
