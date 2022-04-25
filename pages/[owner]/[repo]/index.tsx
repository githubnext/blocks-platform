import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import { AppContext } from "context";
import {
  getRepoInfoWithContributorsSSR,
  makeGitHubAPIInstance,
  makeOctokitInstance,
} from "ghapi";
import { useCheckRepoAccess } from "hooks";
import { makeAppOctokit } from "lib/auth";
import { QueryKeyMap } from "lib/query-keys";
import { GetServerSidePropsContext } from "next";
import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { dehydrate, QueryClient, useQueryClient } from "react-query";

function RepoDetailContainer(props: { hasRepoInstallation: boolean }) {
  const { hasRepoInstallation } = props;
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
        <RepoDetail token={session?.token} />
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

  const octokit = makeOctokitInstance(session.token as string);

  let isPublicRepo = false;
  try {
    const { data: repoInfo } = await octokit.repos.get({
      owner,
      repo,
    });

    isPublicRepo = repoInfo.private === false;
  } catch { }

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

  const appOctokit = makeAppOctokit(orgInstallation?.id);
  let hasRepoInstallation: boolean;

  try {
    await appOctokit.apps.getRepoInstallation({
      owner,
      repo,
    });
    hasRepoInstallation = true;
  } catch (e) {
    hasRepoInstallation = false;
  }

  if (!hasRepoInstallation && !isPublicRepo) {
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
      hasRepoInstallation,
      dehydratedState: dehydrate(queryClient),
    },
  };
}
