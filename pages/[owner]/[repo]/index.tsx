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

  let isPublicRepo = false;
  try {
    const { data: repoInfo } = await octokit.repos.get({
      owner,
      repo,
    });

    isPublicRepo = repoInfo.private === false;
  } catch {}

  // is there an installation on the org?
  // TODO: handle pagination or switch to getOrgInstallation
  const installationsRes =
    await octokit.apps.listInstallationsForAuthenticatedUser();

  const orgInstallation = installationsRes.data.installations.find(
    (installation) =>
      installation.account?.login.toLowerCase() === owner.toLowerCase()
  );
  if (!orgInstallation && !isPublicRepo) {
    return {
      redirect: {
        destination: `/no-access?owner=${owner}&repo=${repo}&reason=org-not-installed`,
        permanent: false,
      },
    };
  }

  // do we have access to the repo?
  // TODO: handle pagination or switch to getRepoInstallation
  const repoInstallationRes =
    await octokit.apps.listInstallationReposForAuthenticatedUser({
      installation_id: orgInstallation.id,
    });
  const repoInstallation = repoInstallationRes.data.repositories.find(
    (repo) => repo.name.toLowerCase() === repo.name.toLowerCase()
  );

  if (!repoInstallation && !isPublicRepo) {
    return {
      redirect: {
        destination: `/no-access?owner=${owner}&repo=${repo}&reason=repo-not-installed`,
        permanent: false,
      },
    };
  }

  // TODO: let's use this to have a second stage of auth
  // for writing to un-authed public repos
  const permissions = orgInstallation?.permissions || {
    contents: "read",
  };

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
