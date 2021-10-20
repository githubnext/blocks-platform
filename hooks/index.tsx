import { useQuery, UseQueryOptions } from "react-query";
import { Octokit } from "@octokit/rest";
import { components } from "@octokit/openapi-types";

const octokit = new Octokit();

interface RepoContext {
  repo: string;
  owner: string;
}

interface UseFileContentParams extends RepoContext {
  path: string;
}

export type DirectoryItem = components["schemas"]["content-directory"][number];

async function getFileContent(
  params: UseFileContentParams
): Promise<DirectoryItem> {
  const { repo, owner, path } = params;

  const { data, status } = await octokit.repos.getContent({
    owner,
    repo,
    path,
  });

  if (status !== 200) throw new Error("Something bad happened");

  if (Array.isArray(data)) {
    return data[0];
  } else {
    return data;
  }
}

export function useFileContent(
  params: UseFileContentParams,
  config?: UseQueryOptions<DirectoryItem>
) {
  const { repo, owner, path } = params;

  return useQuery(
    ["file", params],
    () =>
      getFileContent({
        repo,
        owner,
        path,
      }),
    config
  );
}
