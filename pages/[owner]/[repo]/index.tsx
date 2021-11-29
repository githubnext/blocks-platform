import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

const unauthenticatedRepos = [
  "githubnext/blocks-tutorial"
]
export default function RepoDetailContainer() {
  const router = useRouter();
  const { repo, owner } = router.query;
  const isViewingUnauthenticatedRepo = unauthenticatedRepos.includes(`${owner}/${repo}`);

  const { data: session, status } = useSession({
    required: isViewingUnauthenticatedRepo,
    onUnauthenticated: () => {
      if (isViewingUnauthenticatedRepo) return
      // @ts-ignore
      signIn("github");
    },
  });

  useEffect(() => {
    if (!isViewingUnauthenticatedRepo && status === "unauthenticated") {
      router.push("/");
    }
  }, [status, isViewingUnauthenticatedRepo])

  if (!isViewingUnauthenticatedRepo && status === "loading") {
    return <FullPageLoader />;
  }

  if (isViewingUnauthenticatedRepo || (status === "authenticated" && session)) {
    // @ts-ignore
    return <RepoDetail session={session} />;
  }

  // TODO: Handle errors here
  return null;
}
