import { GetServerSidePropsContext } from "next";
import getConfig from "next/config";
import { useRouter } from "next/router";
import { getSessionOnServer } from "pages/api/auth/[...nextauth]";
import makeBranchPath from "utils/makeBranchPath";

const { publicRuntimeConfig } = getConfig();

const RedirectPage = (props: { defaultBranch: string }) => {
  const { defaultBranch } = props;
  const router = useRouter();
  const query = router.query;
  const { path, branch, ...queryRest } = query as Record<string, string>;

  // redirect to default branch
  if (typeof window !== "undefined") {
    router.push(
      {
        pathname: "/[owner]/[repo]/blob/[...branchPath]",
        query: {
          ...queryRest,
          branchPath: makeBranchPath(branch ?? defaultBranch, path),
        },
      },
      undefined,
      { shallow: true }
    );
  }
  return null;
};

export default RedirectPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSessionOnServer(context.req);
  if (!session.hasAccess) {
    return {
      redirect: {
        destination: "/signup",
        permanent: false,
      },
    };
  }
  const query = context.query as Record<string, string>;
  const { owner, repo, devServer } = query;

  const defaultBranch = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Authorization: `token ${session.userToken}`,
      },
    }
  )
    .then((res) => res.json())
    .then((json) => json.default_branch);

  const isDev = process.env.NODE_ENV !== "production";

  const frameSrc = ["frame-src", publicRuntimeConfig.sandboxDomain, devServer]
    .filter(Boolean)
    .join(" ");

  const connectSrc = [
    "connect-src",
    "'self'",
    // for local dev
    isDev && "webpack://*",
    isDev && "ws://*",
    // for access checking
    process.env.NEXT_PUBLIC_FUNCTIONS_URL,
    // for hitting the GitHub API
    "https://api.github.com/",
    // downloading Actions Artifacts
    "https://pipelines.actions.githubusercontent.com/",
    // for Analytics
    "https://octo-metrics.azurewebsites.net/api/CaptureEvent",
    "https://eastus-8.in.applicationinsights.azure.com/",
    devServer,
  ]
    .filter(Boolean)
    .join(" ");

  context.res.setHeader(
    "Content-Security-Policy",
    [context.res.getHeader("Content-Security-Policy"), frameSrc, connectSrc]
      .filter(Boolean)
      .join(";")
  );

  return {
    props: {
      defaultBranch,
    },
  };
}
