import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { Octokit } from "@octokit/rest";
import { Base64 } from "js-base64";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  UseFileContentParams,
  getFileContent,
  getFolderContent,
  getRepoInfo,
  getRepoFiles,
  RepoContext,
  RepoContextWithToken,
  UseFolderContentParams,
  getFileContentsAndDependencies,
  SearchContextWithToken,
  searchRepos,
  getRepoTimeline,
} from "ghapi";

// get env variable
const GITHUB_PAT = process.env.NEXT_PUBLIC_GITHUB_PAT;
export const octokit = new Octokit({
  // AUTH GOES HERE
  auth: GITHUB_PAT,
});

export function useFileContent(
  params: UseFileContentParams,
  config?: UseQueryOptions<any>
) {
  const { repo, owner, path, fileRef = "main", token } = params;

  return useQuery(
    ["file", params, config?.queryKey],
    () =>
      getFileContent({
        repo,
        owner,
        path,
        fileRef,
        token,
      }),
    {
      enabled:
        Boolean(repo) && Boolean(owner) && Boolean(path) && Boolean(token),
      refetchOnWindowFocus: false,
      retry: false,
      ...config,
    }
  );
}

export function useFolderContent(
  params: UseFolderContentParams,
  config?: UseQueryOptions<FolderData>
) {
  const { repo, owner, path, fileRef, token } = params;

  return useQuery(
    ["folder", params],
    () =>
      getFolderContent({
        repo,
        owner,
        path,
        fileRef,
        token,
      }),
    // @ts-ignore
    {
      ...config,
      retry: false,
      refetchOnWindowFocus: false,
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
        name: `GitHub Block Bot`,
        email: "fake@fake.com",
      },
      author: {
        name: `GitHub Block Bot`,
        email: "fake@fake.com",
      },
      sha: sha,
    });
  } catch (e) { }
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
  const { data: metadataData } = useFileContent(
    {
      repo,
      owner,
      path: metadataPath,
      token,
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const [fullMetadata, setFullMetadata] = useState<any>();

  useEffect(() => {
    try {
      const rawString = metadataData.content;
      const fullMetadata = JSON.parse(rawString);
      setFullMetadata(fullMetadata);
    } catch (e) {
      console.error(e);
      setFullMetadata({});
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
      setFullMetadata(fullContents);
    },
    [mutateAsync, owner, repo, metadataPath, filePath]
  );

  return {
    metadata,
    onUpdateMetadata,
  };
}

export function useRepoInfo(params: RepoContextWithToken) {
  return useQuery(["info", params], () => getRepoInfo(params), {
    enabled:
      Boolean(params.repo) && Boolean(params.owner) && Boolean(params.token),
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useRepoTimeline(params: RepoContextWithToken & { path: string }) {
  return useQuery(["timeline", params], () => getRepoTimeline(params), {
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

export function useBlockContentAndDependencies(params: UseFileContentParams) {
  const { repo, owner, path, fileRef = "main", token } = params;

  return useQuery(
    ["block-content-and-dependencies", params],
    () =>
      getFileContentsAndDependencies({
        repo,
        owner,
        path,
        fileRef,
        token,
      }),
    {
      enabled: Boolean(repo) && Boolean(owner) && Boolean(path),
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

export function useSearchRepos(params: SearchContextWithToken) {
  return useQuery(["search-repos", params], () => searchRepos(params), {
    enabled: Boolean(params.user) && Boolean(params.token),
    refetchOnWindowFocus: false,
    retry: false,
  });
}

interface BlocksInfo {
  "owner": string,
  "repo": string,
  "full_name": string,
  "id": number,
  "html_url": string,
  "description": string,
  "stars": number,
  "watchers": number,
  "language": string,
  "topics": string[],
  "blocks": Block[],
  "release": {
    "tag_name": string,
    "name": string,
    "tarball_url": string,
    "zipball_url": string,
    "published_at": string,
    "browser_download_url": string
  }
}

export function useGetBlocksInfo() {
  return useQuery<BlocksInfo[]>(["blocks-info"], () => {
    const url = "https://blocks-marketplace.vercel.app/blocks-processed-full.json"
    return fetch(url).then(res => res.json())
  }, {
    refetchOnWindowFocus: false,
    retry: false,
  });
}
