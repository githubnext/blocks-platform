import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { Octokit } from "@octokit/rest";
import { components } from "@octokit/openapi-types";
import { Base64 } from "js-base64";

const octokit = new Octokit({
  // AUTH GOES HERE
});

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

interface UseUpdateFileContentParams extends RepoContext {
  content: string;
  path: string;
  sha: string;
}

async function updateFileContents(params: UseUpdateFileContentParams) {
  const contentEncoded = Base64.encode(params.content);

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      message: `feat: updated ${params.path} programatically`,
      content: contentEncoded,
      committer: {
        name: `Composable GitHub Bot`,
        email: "fake@fake.com",
      },
      author: {
        name: `Composable GitHub Bot`,
        email: "fake@fake.com",
      },
      sha: params.sha,
    });
  } catch (e) {
    console.log(e);
  }
}

export function useUpdateFileContents(
  config?: UseMutationOptions<any, any, UseUpdateFileContentParams>
) {
  return useMutation(updateFileContents, config);
}
