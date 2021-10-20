import { useQuery, UseQueryOptions } from "react-query";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";

const octokit = new Octokit();

interface RepoContext {
  repo: string;
  owner: string;
}

interface UseFileContentParams extends RepoContext {
  path: string;
}

type FileContent =
  RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"];

async function getFileContent(
  params: UseFileContentParams
): Promise<FileContent> {
  const { repo, owner, path } = params;

  const { data, status } = await octokit.repos.getContent({
    owner,
    repo,
    path,
  });

  if (status !== 200) throw new Error("Something bad happened");

  return data;
}

export function useFileContent(
  params: UseFileContentParams,
  config?: UseQueryOptions<FileContent>
) {
  const { repo, owner, path } = params;

  return useQuery(
    ["file", path],
    () =>
      getFileContent({
        repo,
        owner,
        path,
      }),
    config
  );
}
