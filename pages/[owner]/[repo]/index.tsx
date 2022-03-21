import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import { makeGitHubAPIInstance, makeOctokitInstance } from "ghapi";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useQueryClient } from "react-query";

function RepoDetailContainer() {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession({
    required: true,
  });

  useEffect(() => {
    if (status !== "authenticated") return;

    let meta = {
      ghapi: makeGitHubAPIInstance(session?.token),
      octokit: makeOctokitInstance(session?.token),
    };

    queryClient.setDefaultOptions({
      queries: {
        meta,
      },
    });
  }, [status]);

  if (status === "loading") {
    return <FullPageLoader />;
  }

  if (status === "authenticated" && session) {
    // @ts-ignore
    return <RepoDetail token={session?.token} />;
  }

  // TODO: Handle errors here
  return null;
}

export default RepoDetailContainer;
