import { Block, BlocksRepo, RepoFiles } from "@githubnext/blocks";
import { Octokit } from "@octokit/rest";
import pm from "picomatch";
import {
  BlocksQueryMeta,
  createBranchAndPR,
  CreateBranchParams,
  CreateBranchResponse,
  getBranches,
  getFileContent,
  getFolderContent,
  getRepoFiles,
  getRepoInfoWithContributors,
  getRepoTimeline,
  RepoContext,
  RepoSearchResult,
  searchRepos,
  checkAccess,
  getBlocksFromRepo,
  getBlocksRepos,
} from "ghapi";
import { Base64 } from "js-base64";
import {
  BlocksKeyParams,
  BlockContentKeyParams,
  BranchesKeyParams,
  CheckAccessParams,
  FileKeyParams,
  FilesKeyParams,
  FolderKeyParams,
  GenericQueryKey,
  InfoKeyParams,
  QueryKeyMap,
  TimelineKeyParams,
  BlocksReposParams,
} from "lib/query-keys";
import { isArray } from "lodash";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import type { QueryFunction, UseQueryResult } from "react-query";
import { useSession } from "next-auth/react";

export function useFileContent(
  params: FileKeyParams,
  config?: UseQueryOptions<FileData>
) {
  const { repo, owner, path } = params;

  return useQuery<FileData, any, FileData, GenericQueryKey<FileKeyParams>>(
    QueryKeyMap.file.factory(params),
    getFileContent,
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
  >(QueryKeyMap.folder.factory(params), getFolderContent, {
    ...config,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

interface UseUpdateFileContentParams extends RepoContext {
  content: string;
  path: string;
  ref: string; // The name of the commit/branch/tag.
  branch: string; // Required in order to target createOrUpdateFileContents
  token?: string;
}

export async function updateFileContents(params: UseUpdateFileContentParams) {
  const contentEncoded = Base64.encode(params.content);
  const octokit = new Octokit({
    auth: params.token,
  });

  let fileSha = params.ref;
  try {
    const { data } = await octokit.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      ref: params.ref,
    });

    // Octokit is silly here and potentially returns an array of contents.
    if (isArray(data)) {
      fileSha = data[0].sha;
    } else {
      fileSha = data.sha;
    }
  } catch (e) {}

  try {
    const res = await octokit.repos.createOrUpdateFileContents({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      message: `feat: updated ${params.path} programatically`,
      content: contentEncoded,
      branch: params.branch,
      sha: fileSha,
    });
    return res.data.commit.sha;
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
  branchName,
}: {
  owner: string;
  repo: string;
  metadataPath: string;
  filePath: string;
  token: string;
  branchName: string;
}) {
  const { data: metadataData } = useFileContent(
    {
      repo,
      owner,
      path: metadataPath,
      fileRef: branchName,
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
    } catch (e) {}
  }, [metadataData, branchName]);

  const { mutateAsync } = useUpdateFileContents({});
  const onUpdateMetadata = useCallback(
    async (contents, overridePath = null) => {
      if (!token) return;
      await mutateAsync({
        content: JSON.stringify(contents, null, 2),
        owner,
        repo,
        path: overridePath || metadataPath,
        ref: branchName,
        branch: branchName,
        token,
      });
      setMetadata(contents);
    },
    [mutateAsync, owner, repo, metadataPath, filePath, token, branchName]
  );

  return {
    metadata,
    onUpdateMetadata,
  };
}

export function useRepoInfo(
  params: InfoKeyParams,
  config?: UseQueryOptions<RepoInfo>
) {
  return useQuery<RepoInfo, any, RepoInfo, GenericQueryKey<InfoKeyParams>>(
    QueryKeyMap.info.factory(params),
    getRepoInfoWithContributors,
    {
      enabled: Boolean(params.repo) && Boolean(params.owner),
      refetchOnWindowFocus: false,
      retry: false,
      ...config,
    }
  );
}

export function useRepoTimeline(
  params: TimelineKeyParams,
  config?: UseQueryOptions<RepoTimeline>
) {
  return useQuery<
    RepoTimeline,
    any,
    RepoTimeline,
    GenericQueryKey<TimelineKeyParams>
  >(QueryKeyMap.timeline.factory(params), getRepoTimeline, {
    cacheTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
    ...config,
  });
}

export function useBlocksFromRepo(
  params: BlocksKeyParams,
  config?: UseQueryOptions<BlocksRepo>
) {
  return useQuery<
    BlocksRepo,
    any,
    BlocksRepo,
    GenericQueryKey<BlocksKeyParams>
  >(QueryKeyMap.blocksRepo.factory(params), getBlocksFromRepo, {
    cacheTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
    ...config,
  });
}

export function useRepoFiles(
  params: FilesKeyParams,
  config?: UseQueryOptions<RepoFiles>
) {
  return useQuery<RepoFiles, any, RepoFiles, GenericQueryKey<FilesKeyParams>>(
    QueryKeyMap.files.factory(params),
    getRepoFiles,
    {
      refetchOnWindowFocus: false,
      retry: false,
      ...config,
    }
  );
}

export function useGetBranches(
  params: BranchesKeyParams,
  config?: UseQueryOptions<Branch[]>
) {
  return useQuery<Branch[], any, Branch[], GenericQueryKey<BranchesKeyParams>>(
    QueryKeyMap.branches.factory(params),
    getBranches,
    {
      refetchOnWindowFocus: false,
      retry: false,
      ...config,
    }
  );
}

export function useBlocksRepos(
  params: BlocksReposParams,
  config?: UseQueryOptions<BlocksRepo[]>
) {
  return useQuery<BlocksRepo[]>(
    QueryKeyMap.blocksRepos.factory(params),
    getBlocksRepos,
    {
      refetchOnWindowFocus: false,
      retry: false,
      ...config,
    }
  );
}

const defaultFileBlock = {
  id: "code-block",
  owner: "githubnext",
  repo: "blocks-examples",
} as Block;

const defaultFolderBlock = {
  id: "overview-block",
  owner: "githubnext",
  repo: "blocks-examples",
} as Block;
export const getBlockKey = (block: Block) =>
  [block?.owner, block?.repo, block?.id || ""].join("__");

interface UseManageBlockParams {
  path: string;
  storedDefaultBlock?: string;
  isFolder: boolean;
}

export type UseManageBlockResult = UseQueryResult<{
  block: Block;
  setBlock: (block: Block) => void;
  defaultBlock: Block;
}>;

export function useManageBlock({
  path,
  storedDefaultBlock = "",
  isFolder,
}: UseManageBlockParams): UseManageBlockResult {
  const router = useRouter();
  const { blockKey = "" } = router.query as Record<string, string>;
  const {
    data: { user },
  } = useSession();

  const type = isFolder ? "folder" : "file";
  const filteredBlocksReposResult = useBlocksRepos({ path, type });

  // do we need to load any Blocks from private repos?
  const [blockKeyOwner, blockKeyRepo] = blockKey.split("__");
  const blockKeyResult = useBlocksFromRepo({
    path,
    type,
    owner: blockKeyOwner,
    repo: blockKeyRepo,
  });
  const [storedDefaultBlockOwner, storedDefaultBlockRepo] =
    storedDefaultBlock.split("__");
  const storedDefaultBlockResult = useBlocksFromRepo({
    path,
    type,
    owner: storedDefaultBlockOwner,
    repo: storedDefaultBlockRepo,
  });

  const incomplete = [
    filteredBlocksReposResult,
    blockKeyResult,
    storedDefaultBlockResult,
  ].find((r) => r.status !== "success");
  if (incomplete) return incomplete as UseManageBlockResult;

  const blocksRepos = [
    ...filteredBlocksReposResult.data,
    blockKeyResult.data,
    storedDefaultBlockResult.data,
  ].filter(Boolean);

  const exampleBlocks =
    blocksRepos.find(
      (b) => b.owner === "githubnext" && b.repo === "blocks-examples"
    )?.blocks ?? [];
  const extension = (path as string).split(".").slice(-1)[0];

  // find default block
  const tryToGetBlockFromKey = (key = ""): Block | null => {
    let [blockOwner, blockRepo, blockId] = key.split("__");
    if (!blockOwner) blockOwner = defaultFileBlock.owner;
    if (!blockRepo) blockRepo = defaultFileBlock.repo;
    const blocksRepo = blocksRepos.find(
      (b) => b.owner === blockOwner && b.repo === blockRepo
    );
    const block = blocksRepo?.blocks.find((b) => b.id === blockId);
    if (!block) {
      return null;
    }
    if (isFolder !== (block.type === "folder")) return null;
    return {
      ...block,
      owner: blocksRepo.owner,
      repo: blocksRepo.repo,
    };
  };

  // first, default to block from url param
  const blockInUrl = tryToGetBlockFromKey(blockKey as string);
  const blockFromMetadata = tryToGetBlockFromKey(storedDefaultBlock);
  let fallbackDefaultBlock: Block = overrideDefaultBlocks[extension]
    ? exampleBlocks.find((b) => b.id === overrideDefaultBlocks[extension])
    : // the first example block is always the code block,
      // so let's default to the second one, when available
      exampleBlocks[1] || exampleBlocks[0];

  if (
    !fallbackDefaultBlock ||
    isFolder !== (fallbackDefaultBlock.type === "folder")
  ) {
    fallbackDefaultBlock = isFolder ? defaultFolderBlock : defaultFileBlock;
  }

  const defaultBlock = blockFromMetadata || fallbackDefaultBlock;
  const block = blockInUrl || defaultBlock;

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
    ...filteredBlocksReposResult,
    data: {
      block,
      setBlock,
      defaultBlock,
    },
  } as UseManageBlockResult;
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

export function useSearchRepos(
  query: string,
  config?: UseQueryOptions<RepoSearchResult[]>
) {
  return useQuery<RepoSearchResult[], any, RepoSearchResult[]>(
    QueryKeyMap.searchRepos.factory(query),
    searchRepos,
    config
  );
}

export interface BlockContent {
  name: string;
  content: string;
}

export const getBlockContent: QueryFunction<
  BlockContent[],
  GenericQueryKey<BlockContentKeyParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  const { owner, repo, id } = params;
  let meta = ctx.meta as unknown as BlocksQueryMeta;

  const url = `/api/get-block-content?owner=${owner}&repo=${repo}&id=${id}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${meta.token}` },
  });
  return (await res.json()).content;
};

export function useBlockContent(
  params: BlockContentKeyParams,
  config?: UseQueryOptions<BlockContent[]>
): UseQueryResult<BlockContent[]> {
  return useQuery(QueryKeyMap.blockContent.factory(params), getBlockContent, {
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...config,
  });
}

// like `useCallback`, but always returns the same function
export function useCallbackWithProps<P, A, R>(
  callback: (props: P) => (arg: A) => R,
  props: P
): (arg: A) => R {
  const propsRef = useRef<P>();
  propsRef.current = props;
  return useCallback((arg: A) => callback(propsRef.current)(arg), []);
}

export function useCheckRepoAccess(
  params: CheckAccessParams,
  config?: UseQueryOptions<boolean>
): UseQueryResult<boolean> {
  return useQuery(QueryKeyMap.checkAccess.factory(params), checkAccess, {
    refetchInterval: 5000,
    retry: false,
    ...config,
  });
}
