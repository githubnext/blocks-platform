import axios from "axios";
import { useRouter } from "next/router";
import { useQuery } from "react-query";

const checkAccess = async ({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) => {
  const res = await axios.get(`/api/check-access`, {
    params: {
      owner,
      repo,
    },
  });
  return res.data;
};

export default function NoAccess() {
  const router = useRouter();
  const { owner, repo } = router.query as Record<string, string>;

  useQuery(["checkAccess", owner, repo], () => checkAccess({ owner, repo }), {
    refetchInterval: 5000,
    enabled: router.isReady,
    onSuccess: (hasAccess) => {
      if (hasAccess) {
        router.push(`/${owner}/${repo}`);
      }
    },
  });

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h3 className="font-bold text-lg">
        Our GitHub App can't find this repo ({owner}/{repo})
      </h3>
      <p className="text-gray-700 mt-2">
        Have you installed the app on this particular repository?
      </p>
      <div className="mt-4">
        <a
          target="_blank"
          rel="noopener"
          href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`}
          className="inline-block px-3 py-1 text-sm rounded font-medium bg-[#2da44e] text-white"
        >
          Grant Access
        </a>
      </div>
    </div>
  );
}
