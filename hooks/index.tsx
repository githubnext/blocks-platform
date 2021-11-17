import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { Octokit } from "@octokit/rest";
import { Base64 } from "js-base64";
import { useCallback, useMemo, useState } from "react";
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

export function useViewerContentAndDependencies(params: UseFileContentParams) {
  const { repo, owner, path, fileRef = "main", token } = params;

  return useQuery(
    ["viewer-content-and-dependencies", params],
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
