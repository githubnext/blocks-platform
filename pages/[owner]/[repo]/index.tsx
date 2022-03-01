import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

function RepoDetailContainer() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
  });

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
