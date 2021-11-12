import { FullPageLoader } from "components/full-page-loader";
import { RepoDetail } from "components/repo-detail";
import { signIn, useSession } from "next-auth/react";

export default function RepoDetailContainer() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => {
      // @ts-ignore
      signIn("github");
    },
  });

  if (status === "loading") {
    return <FullPageLoader />;
  }

  if (status === "authenticated" && session) {
    return <RepoDetail session={session} />;
  }

  // TODO: Handle errors here
  return null;
}
