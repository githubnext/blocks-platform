import { useCheckRepoAccess } from "hooks";
import { useRouter } from "next/router";

export default function NoAccess() {
  const router = useRouter();
  const { owner, repo, reason } = router.query as Record<string, string>;

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
          {reason === "org-not-installed" ? (
            <>
              You don't have our GitHub App installed on the {owner}{" "}
              organization.
            </>
          ) : reason === "repo-not-installed" ? (
            <>
              Our GitHub App is installed on the {owner} organization, but not
              on this repository ({repo}).
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
            href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`}
            className="inline-block px-3 py-1 text-sm rounded font-medium bg-[#2da44e] text-white"
          >
            Install app.
          </a>
        </div>
      </div>
    </div>
  );
}
