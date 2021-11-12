import { FullPageLoader } from "components/full-page-loader";
import { IndexPageDetail } from "components/index-page-detail";
import { signIn, useSession } from "next-auth/react";

export default function IndexPageContainer() {
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
    return <IndexPageDetail session={session} />;
  }

  // TODO: Handle errors here
  return null;
}
