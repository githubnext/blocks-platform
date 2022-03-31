import { RepoFiles } from "@githubnext/utils";
import { Octokit } from "@octokit/rest";
import pm from "picomatch";
import { defaultBlocksRepo as exampleBlocksRepo } from "blocks/index";
import {
  Branch,
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
} from "ghapi";
import { Base64 } from "js-base64";
import {
  BranchesKeyParams,
  FileKeyParams,
  FilesKeyParams,
  FolderKeyParams,
  GenericQueryKey,
  InfoKeyParams,
  QueryKeyMap,
  TimelineKeyParams,
} from "lib/query-keys";
import { isArray } from "lodash";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import type { UseQueryResult } from "react-query";

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

async function updateFileContents(params: UseUpdateFileContentParams) {
  const contentEncoded = Base64.encode(params.content);
  const octokit = new Octokit({
    auth: params.token,
  });

  const { data } = await octokit.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    ref: params.ref,
  });

  let fileSha;
  // Octokit is silly here and potentially returns an array of contents.
  if (isArray(data)) {
    fileSha = data[0].sha;
  } else {
    fileSha = data.sha;
  }

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
    } catch (e) {
      setMetadata({});
    }
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

export function useRepoInfo(params: InfoKeyParams) {
  return useQuery<RepoInfo, any, RepoInfo, GenericQueryKey<InfoKeyParams>>(
    QueryKeyMap.info.factory(params),
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
  config?: UseQueryOptions<RepoTimeline>
) {
  return useQuery<
    RepoTimeline,
    any,
    RepoTimeline,
    GenericQueryKey<TimelineKeyParams>
  >(QueryKeyMap.timeline.factory(params), getRepoTimeline, {
    cacheTime: 0,
    enabled: Boolean(params.repo) && Boolean(params.owner),
    refetchOnWindowFocus: false,
    retry: false,
    ...config,
  });
}

export function useRepoFiles(params: FilesKeyParams) {
  return useQuery<RepoFiles, any, RepoFiles, GenericQueryKey<FilesKeyParams>>(
    QueryKeyMap.files.factory(params),
    getRepoFiles,
    {
      enabled: Boolean(params.repo) && Boolean(params.owner),
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

export function useGetBranches(params: BranchesKeyParams) {
  return useQuery<Branch[], any, Branch[], GenericQueryKey<BranchesKeyParams>>(
    QueryKeyMap.branches.factory(params),
    getBranches,
    {
      enabled: Boolean(params.repo) && Boolean(params.owner),
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

export interface BlocksRepo {
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

export function useAllBlocksRepos() {
  return useQuery<BlocksRepo[]>(
    QueryKeyMap.blocksRepos.factory(),
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

export type UseManageBlockResult = UseQueryResult<{
  block: Block;
  setBlock: (block: Block) => void;
  defaultBlock: Block;
}>;

export function useManageBlock({
  path,
  storedDefaultBlock,
  isFolder,
}: UseManageBlockParams): UseManageBlockResult {
  const router = useRouter();
  const { blockKey = "" } = router.query;

  const filteredBlocksReposResult = useFilteredBlocksRepos(
    path,
    isFolder ? "folder" : "file"
  );

  switch (filteredBlocksReposResult.status) {
    case "success": {
      const blocksRepos = filteredBlocksReposResult.data;

      const exampleBlocks =
        blocksRepos.find(
          (b) =>
            b.owner === exampleBlocksRepo.owner &&
            b.repo === exampleBlocksRepo.repo
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
        if (!block) return null;
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

    default:
      return filteredBlocksReposResult as UseManageBlockResult;
  }
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

export function useFilteredBlocksRepos(
  path: string | undefined = undefined,
  type: "file" | "folder" = "file"
): UseQueryResult<BlocksRepo[]> {
  const allBlocksReposResult = useAllBlocksRepos();
  return useMemo(() => {
    switch (allBlocksReposResult.status) {
      case "success":
        return {
          ...allBlocksReposResult,
          data: allBlocksReposResult.data
            .map((repo) => {
              const filteredBlocks: Block[] = repo.blocks.filter(
                (block: Block) => {
                  // don't include example Blocks
                  if (
                    block.title === "Example File Block" ||
                    block.title === "Example Folder Block"
                  ) {
                    return false;
                  }

                  if (block.type !== type) return false;

                  if (path === undefined) return true;

                  if (Boolean(block.matches)) {
                    return pm(block.matches, { bash: true, dot: true })(path);
                  }

                  if (block.extensions) {
                    const extension = path.split(".").pop();
                    return (
                      block.extensions.includes("*") ||
                      block.extensions.includes(extension)
                    );
                  }

                  return true;
                }
              );
              const blocks: Block[] = filteredBlocks.map((b) => ({
                ...b,
                owner: repo.owner,
                repo: repo.repo,
              }));
              return { ...repo, blocks };
            })
            .filter((repo) => repo?.blocks?.length),
        };

      default:
        return allBlocksReposResult;
    }
  }, [allBlocksReposResult.data, path]);
}
