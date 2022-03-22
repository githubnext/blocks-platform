import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import { Octokit } from "@octokit/rest";
import { Base64 } from "js-base64";
import { useCallback, useEffect, useState } from "react";
import {
  UseFileContentParams,
  getFileContent,
  getFolderContent,
  getRepoInfoWithContributors,
  getRepoFiles,
  getBranches,
  RepoContext,
  RepoContextWithToken,
  getRepoTimeline,
  CreateBranchResponse,
  CreateBranchParams,
  createBranchAndPR,
} from "ghapi";
import { defaultBlocksRepo as exampleBlocksInfo } from "blocks/index";
import { useRouter } from "next/router";
import {
  FilesKeyParams,
  FolderKeyParams,
  GenericQueryKey,
  InfoKeyParams,
  queryKeys,
  TimelineKeyParams,
} from "lib/query-keys";
import { RepoFiles } from "@githubnext/utils";

export function useFileContent(
  params: UseFileContentParams,
  config?: UseQueryOptions<any>
) {
  const { repo, owner, path, fileRef = "main", token } = params;

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
      enabled: Boolean(repo) && Boolean(owner) && Boolean(path),
      refetchOnWindowFocus: false,
      retry: false,
      ...config,
    }
  );
}

export function useFolderContent(
  params: FolderKeyParams,
  config?: UseQueryOptions<FolderData>
) {
  return useQuery<
    FolderData,
    any,
    FolderData,
    GenericQueryKey<FolderKeyParams>
  >(
    queryKeys.folder(params),
    getFolderContent,
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

  // todo(use client side SHA which we already have for this update)
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

export function useRepoInfo(params: InfoKeyParams) {
  return useQuery<RepoInfo, any, RepoInfo, GenericQueryKey<InfoKeyParams>>(
    queryKeys.info(params),
    getRepoInfoWithContributors,
    {
      enabled: Boolean(params.repo) && Boolean(params.owner),
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

export function useRepoTimeline(
  params: TimelineKeyParams,
  config?: UseQueryOptions<RepoTimeline, any, any>
) {
  return useQuery<
    RepoTimeline,
    any,
    RepoTimeline,
    GenericQueryKey<TimelineKeyParams>
  >(queryKeys.timeline(params), getRepoTimeline, {
    cacheTime: 0,
    enabled: Boolean(params.repo) && Boolean(params.owner),
    refetchOnWindowFocus: false,
    retry: false,
    ...config,
  });
}

export function useRepoFiles(params: FilesKeyParams) {
  return useQuery<RepoFiles, any, RepoFiles, GenericQueryKey<FilesKeyParams>>(
    queryKeys.files(params),
    getRepoFiles,
    {
      enabled: Boolean(params.repo) && Boolean(params.owner),
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

export function useGetBranches(params: RepoContextWithToken) {
  return useQuery(["branches", params], () => getBranches(params), {
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
    queryKeys.blocksInfo(),
    () => {
      const url = `${process.env.NEXT_PUBLIC_MARKETPLACE_URL}/api/blocks`;
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

  // load list of example blocks
  const { data: allBlocksInfo = [] } = useGetBlocksInfo();
  const exampleBlocks = (exampleBlocksInfo?.blocks || []).map(
    (block) =>
      ({
        ...block,
        owner: exampleBlocksInfo.owner,
        repo: exampleBlocksInfo.repo,
      } as Block)
  );
  const extension = (path as string).split(".").slice(-1)[0];
  const relevantExampleBlocksInfo = exampleBlocks.filter(
    (d) =>
      d.type === (isFolder ? "folder" : "file") &&
      (!d.extensions ||
        d.extensions?.includes("*") ||
        d.extensions?.includes(extension))
  );

  // find default block
  const tryToGetBlockFromKey = (key = ""): Block | null => {
    let [blockOwner, blockRepo, blockId] = key.split("__");
    if (!blockOwner) blockOwner = defaultFileBlock.owner;
    if (!blockRepo) blockRepo = defaultFileBlock.repo;
    const isDefaultBlocksRepo =
      `${blockOwner}/${blockRepo}` ===
      `${defaultFileBlock.owner}/${defaultFileBlock.repo}`;
    if (isDefaultBlocksRepo)
      return relevantExampleBlocksInfo.find((b) => b.id === blockId);
    const customBlocksInfo = allBlocksInfo.find(
      (b) => b.owner === blockOwner && b.repo === blockRepo
    );
    const block = customBlocksInfo?.blocks.find((b) => b.id === blockId);
    if (!block) return null;
    if (isFolder !== (block.type === "folder")) return null;
    return {
      ...block,
      owner: customBlocksInfo.owner,
      repo: customBlocksInfo.repo,
    };
  };

  // first, default to block from url param
  const blockInUrl = tryToGetBlockFromKey(blockKey as string);
  const blockFromMetadata = tryToGetBlockFromKey(storedDefaultBlock);
  let fallbackDefaultBlock = overrideDefaultBlocks[extension]
    ? relevantExampleBlocksInfo.find(
        (b) => b.id === overrideDefaultBlocks[extension]
      )
    : // the first example block is always the code block,
      // so let's default to the second one, when available
      relevantExampleBlocksInfo[1] || relevantExampleBlocksInfo[0];

  if (
    !fallbackDefaultBlock ||
    isFolder !== (fallbackDefaultBlock.type === "folder")
  ) {
    fallbackDefaultBlock = isFolder ? defaultFolderBlock : defaultFileBlock;
  }

  const defaultBlock = blockFromMetadata || fallbackDefaultBlock;
  const block = blockInUrl || defaultBlock;

  let blockOptions = relevantExampleBlocksInfo;
  if (block && !blockOptions.some((b) => b.id === block.id)) {
    // If using a custom block, add it to the list
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
    blockOptions: relevantExampleBlocksInfo,
    defaultBlock,
    allBlocksInfo,
  };
}
const overrideDefaultBlocks = {
  js: "code-block",
  ts: "code-block",
};

export function useCreateBranchAndPR(
  config?: UseMutationOptions<CreateBranchResponse, any, CreateBranchParams>
) {
  return useMutation(createBranchAndPR, config);
}
