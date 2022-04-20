import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

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
import { RequestAccess } from "components/request-access";
import { makeAppOctokit } from "lib/auth";
import { useRouter } from "next/router";

type Installation = { id: number };

function RepoDetailContainer({
  repoHasAccess,
  installation,
}: {
  repoHasAccess: boolean;
  installation: Installation | null;
}) {
  const router = useRouter();
  const { owner, repo } = router.query;
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

  if (status === "authenticated" && session && loaded && repoHasAccess) {
    // @ts-ignore
    return <RepoDetail token={session?.token} />;
  }

  if (!repoHasAccess && installation) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>You do not have access to this repository.</p>
        <div className="mt-4">
          <RequestAccess
            installationId={installation.id}
            owner={owner as string}
            repo={repo as string}
          />
        </div>
      </div>
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

  // Next, check if the user has a valid installation of the Blocks GitHub App.
  // If not, redirect to the installation page.
  // Note that we need to user the user's token here, not the GitHub App JWT.
  const octokit = makeOctokitInstance(session.token);
  const appOctokit = makeAppOctokit();
  let installations = [];

  // Check if public or private repo
  // Gate access if private AND no installation

  // How do we handle multiple installations?
  // How do we handle githubnext/blocks + github/github

  try {
    const { data: installationsRes } =
      await octokit.rest.apps.listInstallationsForAuthenticatedUser();

    if (installationsRes.total_count === 0) {
      return {
        redirect: {
          destination: `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`,
          permanent: false,
        },
      };
    }

    installations = installationsRes.installations;
  } catch (e) {
    return {
      redirect: {
        destination: `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`,
        permanent: false,
      },
    };
    // TODO: Handle errors here
  }

  let repoHasAccess: boolean;

  // const { data: app } = await octokit.request("GET /app/installations");
  // console.log(app);

  try {
    const { data } = await appOctokit.apps.getRepoInstallation({ owner, repo });
    // console.log("You have access to this repository", data);
    // repoHasAccess = true;
  } catch (e) {
    // console.log("You DO NOT have access to this repository", e);
    // repoHasAccess = false;
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
      repoHasAccess: true,
      installation: installations.length > 0 ? installations[0] : null,
    },
  };
}
