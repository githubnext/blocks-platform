import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { Octokit } from "@octokit/rest";
import { components } from "@octokit/openapi-types";
import { Base64 } from "js-base64";
import { isArray } from "lodash";

// get env variable
const GITHUB_PAT = process.env.NEXT_PUBLIC_GITHUB_PAT;
export const octokit = new Octokit({
  // AUTH GOES HERE
  auth: GITHUB_PAT,
});

export interface RepoContext {
  repo: string;
  owner: string;
}

export interface UseFileContentParams extends RepoContext {
  path: string;
  fileRef?: string;
}

export type DirectoryItem = components["schemas"]["content-directory"][number];
export type TreeItem = components["schemas"]["git-tree"]["tree"][number];

async function fetchAndConvertContentToString(
  t: TreeItem,
  params: RepoContext
) {
  const { data, status } = await octokit.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: t.path,
  });

  if (status !== 200 || isArray(data))
    throw new Error("Something bad happened");

  return convertContentToString(data);
  // const res = await fetch(d.download_url, {
  //   headers: {
  //     // Authorization: `token ${GITHUB_PAT}`,
  //     Accept: "application/vnd.github.v3.raw",
  //   },
  // });
  // const content = await res.text();
  // return {
  //   ...d,
  //   content,
  // };
}

function convertContentToString(d: DirectoryItem) {
  return {
    ...d,
    content: Buffer.from(d.content ? d.content : "", "base64").toString(),
  };
}

async function getFileContent(
  params: UseFileContentParams
): Promise<DirectoryItem[]> {
  const { repo, owner, path, fileRef } = params;

  const { data, status } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref: fileRef,
  });

  if (status !== 200) throw new Error("Something bad happened");

  if (Array.isArray(data)) {
    return data;
  } else {
    return [data];
  }
}

export function useFileContent(
  params: UseFileContentParams,
  config?: UseQueryOptions<DirectoryItem[]>
) {
  const { repo, owner, path, fileRef } = params;

  return useQuery(
    ["file", params],
    () =>
      getFileContent({
        repo,
        owner,
        path,
        fileRef,
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
  } catch (e) {}
}

export function useUpdateFileContents(
  config?: UseMutationOptions<any, any, UseUpdateFileContentParams>
) {
  return useMutation(updateFileContents, config);
}

async function getViewerTemplateContents(params: RepoContext) {
  const { data, status } = await octokit.git.getTree({
    repo: params.repo,
    owner: params.owner,
    tree_sha: "main",
    recursive: "true",
  });

  if (status !== 200) throw Error("Something bad happened");

  const onlyFiles = data.tree.filter((d) => d.type === "blob");

  return await Promise.all(
    onlyFiles.map((treeItem) =>
      fetchAndConvertContentToString(treeItem, params)
    )
  );
}

export function useViewerTemplateContents(
  params: RepoContext,
  config?: UseQueryOptions<any, any, any>
) {
  return useQuery(["viewer", params], () => getViewerTemplateContents(params), {
    retry: false,
    ...config,
  });
}
