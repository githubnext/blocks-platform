import { useCheckRepoAccess, useSignOutOnSessionError } from "hooks";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function NoAccess({
  installationUrl,
}: {
  installationUrl: string;
}) {
  const router = useRouter();
  const { owner, repo, reason } = router.query as Record<string, string>;

  const { status, data } = useSession({ required: true });
  useSignOutOnSessionError(status, data, {
    callbackUrl: `/${owner}/${repo}`,
  });

  useCheckRepoAccess(
    { owner, repo },
    {
      enabled: router.isReady,
      onSuccess: (hasAccess) => {
        if (hasAccess) {
          router.push(`/${owner}/${repo}`);
        }
      },
    }
  );

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="max-w-2xl mx-auto px-4">
        <h3 className="font-bold text-lg">
          {reason === "repo-not-installed" ? (
            <>
              Our GitHub App is not installed on {owner}/{repo}.
            </>
          ) : (
            <>
              Our GitHub App can't find this repo ({owner}/{repo})
            </>
          )}
        </h3>
        <div className="mt-4">
          <a
            target="_blank"
            rel="noopener"
            href={installationUrl}
            className="inline-block px-3 py-1 text-sm rounded font-medium bg-[#2da44e] text-white"
          >
            Install app.
          </a>
        </div>
      </div>
    </div>
  );
}

export function getServerSideProps() {
  const installationUrl = `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`;
  return {
    props: {
      installationUrl,
    },
  };
}
