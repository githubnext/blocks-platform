import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { Octokit } from "@octokit/rest";
import { components } from "@octokit/openapi-types";
import { Base64 } from "js-base64";
import { useCallback, useMemo, useState } from "react";

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

export interface RepoContextWithToken extends RepoContext {
  token: string;
}

export interface UseFileContentParams extends RepoContext {
  path: string;
  token: string;
  fileRef?: string;
}

export type DirectoryItem = components["schemas"]["content-directory"][number];

async function getFileContent(
  params: UseFileContentParams
): Promise<DirectoryItem[]> {
  const { repo, owner, path, fileRef, token } = params;

  const userOctokit = new Octokit({
    auth: token,
  });

  const { data, status } = await userOctokit.repos.getContent({
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
  config?: UseQueryOptions<any>
) {
  const { repo, owner, path, fileRef, token } = params;

  return useQuery(
    ["file", params],
    () =>
      getFileContent({
        repo,
        owner,
        path,
        fileRef,
        token,
      }),
    {
      enabled: Boolean(repo) && Boolean(owner) && Boolean(token),
      refetchOnWindowFocus: false,
      retry: false,
      ...config,
    }
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
    try {
      const { data, status } = await octokit.repos.getContent({
        owner: params.owner,
        repo: params.repo,
        path: params.path,
      });

      if (status !== 200) throw new Error("Something bad happened");

      // @ts-ignore
      sha = data.sha;
    } catch (e) {
      sha = "HEAD";
    }
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

export function useMetadata({
  owner,
  repo,
  metadataPath,
  filePath,
  token,
}: {
  owner: string;
  repo: string;
  metadataPath: string;
  filePath: string;
  token: string;
}) {
  const [iteration, setIteration] = useState(0);
  const { data: metadataData } = useFileContent(
    {
      repo,
      owner,
      path: metadataPath,
      token,
    },
    {
      queryKey: [iteration],
      refetchOnWindowFocus: false,
    }
  );
  const fullMetadata = useMemo(() => {
    try {
      const encodedStr = metadataData[0].content;
      const rawString = Buffer.from(encodedStr, "base64").toString();
      const fullMetadata = JSON.parse(rawString);
      return fullMetadata;
    } catch (e) {
      return {};
    }
  }, [metadataData]);
  const metadata = useMemo(
    () => fullMetadata?.[filePath] || {},
    [fullMetadata, filePath]
  );
  const { mutateAsync } = useUpdateFileContents({});
  const onUpdateMetadata = useCallback(
    async (contents) => {
      const fullContents = {
        ...fullMetadata,
        [filePath]: contents,
      };
      await mutateAsync({
        content: JSON.stringify(fullContents),
        owner,
        repo,
        path: metadataPath,
        sha: "latest",
      });
      setTimeout(() => {
        setIteration((iteration) => iteration + 1);
      }, 500);
    },
    [mutateAsync, owner, repo, metadataPath, filePath]
  );

  return {
    metadata,
    onUpdateMetadata,
  };
}

interface RepoInfo {
  repoInfo: any;
  activity: any;
  commits: any;
  fileChanges: any;
}

type RepoFiles = any[];

async function getRepoInfo(params: RepoContextWithToken): Promise<RepoInfo> {
  const { owner, repo, token } = params;
  const url = `/api/repo-info?owner=${owner}&repo=${repo}&token=${token}`;
  const res = await fetch(url);
  return await res.json();
}

async function getRepoFiles(params: RepoContextWithToken): Promise<RepoFiles> {
  const { owner, repo, token } = params;
  const url = `/api/file-tree?owner=${owner}&repo=${repo}&token=${token}`;
  const res = await fetch(url);
  const { files } = await res.json();
  return files;
}

export function useRepoInfo(params: RepoContextWithToken) {
  return useQuery(["info", params], () => getRepoInfo(params), {
    enabled:
      Boolean(params.repo) && Boolean(params.owner) && Boolean(params.token),
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useRepoFiles(params: RepoContextWithToken) {
  return useQuery(["files", params], () => getRepoFiles(params), {
    enabled:
      Boolean(params.repo) && Boolean(params.owner) && Boolean(params.token),
    refetchOnWindowFocus: false,
    retry: false,
  });
}
