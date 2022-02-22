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
  getRepoInfoWithContributors,
  getRepoFiles,
  RepoContext,
  RepoContextWithToken,
  UseFolderContentParams,
  getRepoTimeline,
} from "ghapi";
import { defaultBlocksRepo } from "blocks/index";
import { useRouter } from "next/router";

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
      enabled: Boolean(repo) && Boolean(owner) && Boolean(path),
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
  token?: string;
}

async function updateFileContents(params: UseUpdateFileContentParams) {
  const contentEncoded = Base64.encode(params.content);
  let sha = params.sha;
  const octokit = new Octokit({
    auth: params.token,
  });

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
  const { data: metadataData } = useFileContent(
    {
      repo,
      owner,
      path: metadataPath,
      token,
    },
    {
      refetchOnWindowFocus: false,
      useErrorBoundary: false,
    }
  );

  const [metadata, setMetadata] = useState<any>({});

  useEffect(() => {
    if (!metadataData) {
      setMetadata({});
      return;
    }
    try {
      const rawString = metadataData.content;
      const metadata = JSON.parse(rawString);
      setMetadata(metadata);
    } catch (e) {
      setMetadata({});
    }
  }, [metadataData]);

  const { mutateAsync } = useUpdateFileContents({});
  const onUpdateMetadata = useCallback(
    async (contents, overridePath = null) => {
      if (!token) return;

      await mutateAsync({
        content: JSON.stringify(contents, null, 2),
        owner,
        repo,
        path: overridePath || metadataPath,
        sha: "latest",
        token,
      });
      setMetadata(contents);
    },
    [mutateAsync, owner, repo, metadataPath, filePath, token]
  );

  return {
    metadata,
    onUpdateMetadata,
  };
}

export function useRepoInfo(params: RepoContextWithToken) {
  return useQuery(["info", params], () => getRepoInfoWithContributors(params), {
    enabled:
      Boolean(params.repo) && Boolean(params.owner) && Boolean(params.token),
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useRepoTimeline(
  params: RepoContextWithToken & { path: string },
  config?: UseQueryOptions<any>
) {
  return useQuery(
    ["timeline", params, config?.queryKey],
    () => getRepoTimeline(params),
    {
      enabled: Boolean(params.repo) && Boolean(params.owner),
      refetchOnWindowFocus: false,
      retry: false,
      ...config,
    }
  );
}

export function useRepoFiles(params: RepoContextWithToken) {
  return useQuery(["files", params], () => getRepoFiles(params), {
    enabled: Boolean(params.repo) && Boolean(params.owner),
    refetchOnWindowFocus: false,
    retry: false,
  });
}

interface BlocksInfo {
  owner: string;
  repo: string;
  full_name: string;
  id: number;
  html_url: string;
  description: string;
  stars: number;
  watchers: number;
  language: string;
  topics: string[];
  blocks: Block[];
  release: {
    tag_name: string;
    name: string;
    tarball_url: string;
    zipball_url: string;
    published_at: string;
    browser_download_url: string;
  };
}

export function useGetBlocksInfo() {
  return useQuery<BlocksInfo[]>(
    ["blocks-info"],
    () => {
      const url =
        "https://next-devex-blocks-marketplace.azurewebsites.net/api/blocks";
      return fetch(url).then((res) => res.json());
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

const defaultFileBlock = {
  id: "file-block",
  owner: "githubnext",
  repo: "blocks-examples",
} as Block;

const defaultFolderBlock = {
  id: "minimap-block",
  owner: "githubnext",
  repo: "blocks-examples",
} as Block;
export const getBlockKey = (block: Block) =>
  [block?.owner, block?.repo, block?.id || ""].join("__");
const defaultFileBlockKey = getBlockKey(defaultFileBlock);
const defaultFolderBlockKey = getBlockKey(defaultFolderBlock);
interface UseManageBlockParams {
  path: string;
  storedDefaultBlock: string;
  isFolder: boolean;
}
export function useManageBlock({
  path,
  storedDefaultBlock,
  isFolder,
}: UseManageBlockParams) {
  const router = useRouter();
  const { blockKey = "" } = router.query;

  let [
    blockOwner = defaultFileBlock.owner,
    blockRepo = defaultFileBlock.repo,
    blockId,
  ] = (blockKey as string).split("__");
  if (!blockOwner) blockOwner = defaultFileBlock.owner;
  if (!blockRepo) blockRepo = defaultFileBlock.repo;

  const { data: allBlocks = [] } = useGetBlocksInfo();
  // const isDefaultBlocksRepo = `${blockOwner}/${blockRepo}` === `${defaultFileBlock.owner}/${defaultFileBlock.repo}`
  const isDefaultBlocksRepo = true;
  const blocksRepo = isDefaultBlocksRepo
    ? defaultBlocksRepo
    : allBlocks.find(
        (block) => block.owner === blockOwner && block.repo === blockRepo
      );
  const blocks = (blocksRepo?.blocks || []).map(
    (block) =>
      ({
        ...block,
        owner: blocksRepo.owner,
        repo: blocksRepo.repo,
      } as Block)
  );
  const extension = (path as string).split(".").slice(-1)[0];
  const relevantBlocks = blocks.filter(
    (d) =>
      d.type === (isFolder ? "folder" : "file") &&
      (!d.extensions ||
        d.extensions?.includes("*") ||
        d.extensions?.includes(extension))
  );
  const defaultBlockKey =
    storedDefaultBlock ||
    getBlockKey(
      blocks.find((block) => block.id === overrideDefaultBlocks[extension]) ||
        relevantBlocks[1] ||
        relevantBlocks[0]
    );
  const defaultBlock =
    blocks.find((block) => getBlockKey(block) === defaultBlockKey) ||
    relevantBlocks[1];
  blockId =
    blockId ||
    defaultBlock?.id ||
    (isFolder ? defaultFolderBlock.id : defaultFileBlock.id);

  const allBlocksFlat = allBlocks.flatMap((repo) =>
    repo.blocks.map(
      (block) =>
        ({
          ...block,
          owner: repo.owner,
          repo: repo.repo,
        } as Block)
    )
  );

  let block =
    blocks.find((block) => block.id === blockId) ||
    allBlocksFlat.find((block) => block.id === blockId) ||
    blocks[0] ||
    ({} as Block);

  if (
    (isFolder && block.type !== "folder") ||
    (!isFolder && block.type !== "file")
  ) {
    block = defaultBlock;
  }

  let blockOptions = relevantBlocks;
  if (block && !blocks.find((block) => block.id === blockId)) {
    // Add the custom block to the list
    blockOptions.push({ ...block, title: `Custom: ${block.title}` });
  }

  const setBlock = (block: Block) => {
    if (!block) return;
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        blockKey: getBlockKey(block),
      },
    });
  };

  return {
    block,
    setBlock,
    blockOptions: relevantBlocks,
    defaultBlock,
    allBlocks,
  };
}
const overrideDefaultBlocks = {
  js: "code-block",
  ts: "code-block",
};
