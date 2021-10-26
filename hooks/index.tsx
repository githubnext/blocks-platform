import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { Octokit } from "@octokit/rest";
import { components } from "@octokit/openapi-types";
import { Base64 } from "js-base64";

// get env variable
const GITHUB_PAT = process.env.NEXT_PUBLIC_GITHUB_PAT;
export const octokit = new Octokit({
  // AUTH GOES HERE
  auth: GITHUB_PAT
});

interface RepoContext {
  repo: string;
  owner: string;
}

interface UseFileContentParams extends RepoContext {
  path: string;
  fileRef?: string;
}

export type DirectoryItem = components["schemas"]["content-directory"][number];

async function getFileContent(
  params: UseFileContentParams
): Promise<DirectoryItem> {
  const { repo, owner, path, fileRef } = params;

  const { data, status } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref: fileRef
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
  const { repo, owner, path, fileRef } = params;

  return useQuery(
    ["file", params],
    () =>
      getFileContent({
        repo,
        owner,
        path,
        fileRef
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
  let sha = params.sha;

  if (sha === "latest") {
    const { data, status } = await octokit.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
    });

    if (status !== 200) throw new Error("Something bad happened");

    // @ts-ignore
    sha = data.sha;
  }

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
      sha: sha,
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
