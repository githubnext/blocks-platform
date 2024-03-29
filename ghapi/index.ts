import { CODEX_BLOCKS } from "../lib";
import { Octokit } from "@octokit/rest";
import { Endpoints } from "@octokit/types";
import axios, { AxiosInstance } from "axios";
import { signOut } from "next-auth/react";
import { Base64, decode } from "js-base64";
import {
  BlocksKeyParams,
  BlocksReposParams,
  BranchesKeyParams,
  CheckAccessParams,
  FileKeyParams,
  FilesKeyParams,
  FolderKeyParams,
  GenericQueryKey,
  InfoKeyParams,
  QueryKeyMap,
  RepoSearchKeyParams,
  TimelineKeyParams,
} from "lib/query-keys";
import { QueryClient, QueryFunction, QueryFunctionContext } from "react-query";
import { Block, BlocksRepo } from "@githubnext/blocks";
import { Session } from "next-auth";
import pm from "picomatch";
import {
  BlockWithIsAllowed,
  BlocksRepoWithIsAllowed,
  getBlockKey,
} from "hooks";

export interface RepoContext {
  repo: string;
  owner: string;
}

export interface RepoContextWithToken extends RepoContext {
  token: string;
}

export interface UseFileContentParams extends RepoContextWithToken {
  path: string;
  fileRef?: string;
  cache?: string;
}

export interface SearchContext {
  query: string;
}

export interface SearchContextWithToken extends SearchContext {
  token: string;
}

export function makeGitHubAPIInstance(token: string) {
  let instance = axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `token ${token}`,
    },
  });

  instance.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      if (error.response.status === 401) {
        if (typeof window !== "undefined") signOut();
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export function makeOctokitInstance(token: string) {
  return new Octokit({ auth: token });
}

export type BlocksQueryMeta = {
  token: string;
  userToken: string;
  ghapi: AxiosInstance;
  octokit: Octokit;
  user: Session["user"];
  queryClient: QueryClient;
};

export const getFileContent: (
  ctx: QueryFunctionContext<GenericQueryKey<FileKeyParams>>
) => Promise<FileData> = async (ctx) => {
  let meta = ctx.meta as BlocksQueryMeta;
  let params = ctx.queryKey[1];
  const { path, owner, repo, fileRef = "HEAD", doForceCacheRefresh } = params;
  const query = fileRef && fileRef !== "HEAD" ? `?ref=${fileRef}` : "";
  const apiUrl = `repos/${owner}/${repo}/contents/${path}${query}`;

  const file = path.split("/").pop() || "";

  const res = await meta.ghapi(apiUrl, {
    headers: doForceCacheRefresh
      ? {
          // this response is cached for 60s
          // we need to bypass this eg. when a metadata update creates a new file
          "If-None-Match": new Date().getTime().toString(),
        }
      : {},
  });
  if (res.status !== 200) {
    if (res.status === 404) {
      throw new Error(`File not found: ${owner}/${repo}: ${path}`);
    } else {
      throw new Error(`Error fetching file: ${owner}/${repo}: ${path}`);
    }
  }

  const encodedContent = res.data.content;
  const content = Buffer.from(encodedContent, "base64").toString("utf8");

  const context = {
    download_url: apiUrl,
    file,
    path: path,
    repo: repo,
    owner: owner,
    sha: res.data.sha,
    username: "mona",
  };

  return {
    content,
    context,
  };
};

export const getMetadata: (
  ctx: QueryFunctionContext<GenericQueryKey<FileKeyParams>>
) => Promise<any> = (ctx) =>
  getFileContent(ctx).then(
    (data) => {
      try {
        return JSON.parse(data.content);
      } catch {
        return {};
      }
    },
    (err) => {
      return {};
    }
  );

export const getFolderContent: QueryFunction<
  FolderData,
  GenericQueryKey<FolderKeyParams>
> = async (ctx) => {
  let { queryKey } = ctx;
  const { repo, owner, path, fileRef } = queryKey[1];
  let branch = fileRef || "HEAD";
  let meta = ctx.meta as BlocksQueryMeta;
  const apiUrl = `repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const res = await meta.ghapi.get<FolderData>(apiUrl);

  const { tree: rawTree } = res.data;

  const files = (rawTree as TreeItem[]).filter((item) => {
    return item.path?.startsWith(path);
  });

  const tree = files.map((item) => {
    return {
      path: item.path || "",
      mode: item.mode || "",
      type: item.type || "",
      sha: item.sha || "",
      size: item.size || 0,
      url: item.url || "",
    };
  });

  const context = {
    download_url: apiUrl,
    folder: path.split("/").pop() || "",
    path: path,
    repo: repo,
    owner: owner,
    sha: branch,
    username: "mona",
  };

  return {
    tree,
    context,
  };
};

type listRepoFilesResponse =
  Endpoints["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"]["response"];
export type RepoFiles = listRepoFilesResponse["data"]["tree"];

export const getRepoInfoWithContributors: QueryFunction<
  RepoInfo,
  GenericQueryKey<InfoKeyParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  const { owner, repo } = params;
  let meta = ctx.meta as BlocksQueryMeta;
  const url = `repos/${owner}/${repo}`;
  const repoInfoRes = await meta.ghapi.get(url);

  const contributorsUrl = `${url}/contributors`;
  try {
    const contributorsRes = await meta.ghapi.get(contributorsUrl);
    return {
      ...repoInfoRes.data,
      contributors: contributorsRes.data,
    };
  } catch (e) {
    return { ...repoInfoRes.data, contributors: [] };
  }
};

export const getRepoInfo: QueryFunction<
  RepoInfo,
  GenericQueryKey<InfoKeyParams>
> = async (ctx) => {
  let { queryKey } = ctx;
  let meta = ctx.meta as BlocksQueryMeta;
  const { repo, owner } = queryKey[1];
  const url = `repos/${owner}/${repo}`;
  const repoInfoRes = await meta.ghapi(url);
  return repoInfoRes.data;
};
export const searchForRepos: QueryFunction<
  RepoInfo[],
  GenericQueryKey<RepoSearchKeyParams>
> = async (ctx) => {
  let { queryKey } = ctx;
  let meta = ctx.meta as BlocksQueryMeta;
  const { q, order = "desc", sort = "updated", per_page = 100 } = queryKey[1];
  const url = `search/repositories`;
  const res = await meta.ghapi(url, {
    params: {
      q,
      order,
      sort,
      per_page,
    },
  });
  return res.data.items;
};
interface GetRepoInfoSSRParams {
  repo: string;
  owner: string;
  token: string;
}
export async function getRepoInfoWithContributorsSSR(
  params: GetRepoInfoSSRParams
) {
  const { repo, owner, token } = params;
  const ghapi = makeGitHubAPIInstance(token);
  const url = `repos/${owner}/${repo}`;
  const repoInfoRes = await ghapi.get(url);

  const contributorsUrl = `${url}/contributors`;
  try {
    const contributorsRes = await ghapi.get(contributorsUrl);
    return { ...repoInfoRes.data, contributors: contributorsRes.data };
  } catch (e) {
    return { ...repoInfoRes.data, contributors: [] };
  }
}

export const getRepoTimeline: QueryFunction<
  RepoTimeline,
  GenericQueryKey<TimelineKeyParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  let meta = ctx.meta as BlocksQueryMeta;
  const { owner, repo, sha, path } = params;

  const randomQueryParamName = `${Math.random()}`;

  const url = `repos/${owner}/${repo}/commits?path=${path}&${randomQueryParamName}=""&sha=${sha}`;

  const commitsRes = await meta.ghapi(url).catch((e) => {
    return { data: [] };
  });

  const commits: RepoTimeline = commitsRes.data.map((commit: Commit) => ({
    date: commit.commit.author.date,
    // Ran into an error where the author was null.
    username: commit.author?.login,
    message: commit.commit.message,
    url: commit.html_url,
    sha: commit.sha,
  }));

  return commits;
};

export const getRepoFiles: QueryFunction<
  RepoFiles,
  GenericQueryKey<FilesKeyParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  let meta = ctx.meta as BlocksQueryMeta;
  const { owner, repo, sha = "HEAD" } = params;
  if (!owner || !repo) {
    return [];
  }

  const url = `repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;

  const fileTreeRes = await meta
    .ghapi(url, {
      headers: {
        // this response is cached for 60s
        // we need to bypass this eg. when a metadata update creates a new file
        "If-None-Match": new Date().getTime().toString(),
      },
    })
    .catch(() => {
      return {
        data: {
          tree: [],
        },
      };
    });

  const files = fileTreeRes.data.tree;
  return files;
};

export const getBlocksFromRepo: QueryFunction<
  BlocksRepo,
  GenericQueryKey<BlocksKeyParams>
> = async (ctx) => {
  const params: BlocksKeyParams = ctx.queryKey[1];
  const { queryClient, user } = ctx.meta as BlocksQueryMeta;
  const { devServerInfo, owner, repo, path, type, searchTerm } = params;

  if (!owner || !repo) {
    return undefined;
  }

  if (
    devServerInfo &&
    owner === devServerInfo.owner &&
    repo === devServerInfo.repo
  ) {
    return getBlocksRepoFromDevServer({
      devServerInfo,
      user,
      path,
      type,
      searchTerm,
    });
  }

  let blocks = [];

  try {
    const blocksConfig = await queryClient.fetchQuery(
      QueryKeyMap.metadata.factory({ owner, repo, path: "blocks.config.json" }),
      getMetadata,
      {
        staleTime: 5 * 60 * 1000,
      }
    );
    if (Array.isArray(blocksConfig)) {
      blocks = blocksConfig;
    } else {
      // check package.json for backwards compatibility
      const packageJson = await queryClient.fetchQuery(
        QueryKeyMap.metadata.factory({ owner, repo, path: "package.json" }),
        getMetadata,
        {
          staleTime: 5 * 60 * 1000,
        }
      );
      if (Array.isArray(packageJson["blocks"])) {
        blocks = packageJson["blocks"];
      }
    }
  } catch (e) {}

  const filter = filterBlock({ repo, owner, path, type, user, searchTerm });
  const filteredBlocks = (blocks || []).filter(filter).map((block: Block) => ({
    ...block,
    owner,
    repo,
  }));

  return {
    owner,
    repo,
    blocks: filteredBlocks,
    full_name: `${owner}/${repo}`,
    // we don't use any of the below at the moment
    html_url: "",
    description: "",
    stars: 0,
    watchers: 0,
    language: "",
    topics: [""],
  };
};

const filterBlock =
  ({
    path,
    repo,
    owner,
    user,
    type,
    searchTerm,
    excludeExampleBlocks = true,
  }: {
    path: string | undefined;
    repo: string;
    owner: string;
    user: Session["user"];
    type: "file" | "folder" | undefined;
    searchTerm?: string;
    excludeExampleBlocks?: boolean;
  }) =>
  (block: Block) => {
    if (
      !user.isHubber &&
      CODEX_BLOCKS.some((cb) => {
        return block.id === cb.id && owner === cb.owner && repo === cb.repo;
      })
    ) {
      return false;
    }
    // don't include example Blocks
    if (
      excludeExampleBlocks &&
      (block.title === "Example File Block" ||
        block.title === "Example Folder Block")
    ) {
      return false;
    }

    if (type && block.type !== type) return false;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      if (
        ![block.title, block.description]
          .join("\n")
          .toLocaleLowerCase()
          .includes(lowerSearchTerm)
      ) {
        return false;
      }
    }

    if (path !== undefined) {
      if (block.matches) {
        try {
          if (
            path === "" && // the root path
            (block.matches.includes("") || block.matches.includes("*"))
          )
            return true;
          const doesMatch = pm(block.matches, { bash: true, dot: true })(path);
          if (!doesMatch) return false;
        } catch (e) {
          return false;
        }
      }

      if (block.extensions) {
        const extension = path.split(".").pop();
        const doesMatch =
          block.extensions.includes("*") ||
          block.extensions.includes(extension || "");
        if (!doesMatch) return false;
      }
    }

    return true;
  };

export const getBranches: QueryFunction<
  Branch[],
  GenericQueryKey<BranchesKeyParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  const { owner, repo } = params;
  let octokit = ctx.meta.octokit as Octokit;
  const branchesRes = await octokit
    .paginate("GET /repos/{owner}/{repo}/branches", {
      owner,
      repo,
      per_page: 100,
    })
    .catch(() => {
      return [];
    });
  return branchesRes;
};

export interface CreateBranchParams {
  ref: string;
  token: string;
  userToken: string;
  owner: string;
  repo: string;
  content: string;
  path: string;
  title?: string;
  body?: string;
  commitMessage?: string;
  sourceBranch: string;
}

type PullsResponse = Endpoints["POST /repos/{owner}/{repo}/pulls"]["response"];
export type CreateBranchResponse = PullsResponse["data"];

export async function createBranchAndPR(
  params: CreateBranchParams
): Promise<CreateBranchResponse> {
  const {
    token,
    userToken,
    owner,
    repo,
    content,
    path,
    title = `GitHub Blocks: Update ${path}`,
    body = "This is a pull request created programmatically by GitHub Blocks.",
    commitMessage,
    sourceBranch,
  } = params;
  let { ref } = params;
  const octokit = new Octokit({ auth: token });
  const userOctokit = new Octokit({ auth: userToken });
  // "SHAs" abound in this codebase, so let me explain what's going on.
  // In order to create a new branch (a.k.a "ref"), you need the SHA of the branch you're creating it off of.

  // So let's get the SHA of the source branch.
  const currentBranchData = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${sourceBranch}`,
  });
  const sourceSha = currentBranchData.data.object.sha;

  let blobSha;
  try {
    // Let's also get the SHA of the *file* we're going to use when we commit on the new branch.
    const currentFileData = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: sourceBranch,
    });
    // @ts-ignore
    blobSha = currentFileData.data.sha;
  } catch (e) {
    // if we get here, the file doesn't exist yet
    // so we'll create a new blob
    const blobData = await octokit.git.createBlob({
      owner,
      repo,
      content,
      encoding: "utf-8",
    });
    blobSha = blobData.data.sha;
  }

  // Step 1. Create the new branch, using the SHA of the "main" branch as the base.

  const updateBranchNameIfAlreadyExists = async () => {
    try {
      await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${ref}`,
      });
      // if we get here, the branch already exists
      // check for -X where X is a number
      const refNumber = ref.match(/-(\d+)$/);
      if (refNumber) {
        ref = ref.replace(/-(\d+)$/, `-${parseInt(refNumber[1]) + 1}`);
      } else {
        ref = `${ref}-1`;
      }
      await updateBranchNameIfAlreadyExists();
    } catch (e) {
      // if we get here, the branch doesn't exist
    }
  };

  await updateBranchNameIfAlreadyExists();

  await userOctokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${ref}`,
    sha: sourceSha,
  });

  // Step 2. Commit the new file to the new branch.
  await userOctokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: commitMessage || `feat: updated ${params.path} programatically`,
    content: Base64.encode(content),
    branch: ref,
    // @ts-ignore
    sha: blobSha,
  });

  // Step 3. Create the PR using our source branch as the base.
  const res = await userOctokit.pulls.create({
    owner,
    repo,
    head: ref,
    base: sourceBranch,
    title,
    body,
  });
  return res.data;
}

export interface RepoSearchResult {
  id: string;
  text: string;
}

export const searchRepos: QueryFunction<RepoSearchResult[]> = async (ctx) => {
  let query = ctx.queryKey[1];
  let meta = ctx.meta as BlocksQueryMeta;
  const url = `search/repositories?q=${query}+in:name&sort=stars&order=desc&per_page=10`;

  const res = await meta.ghapi(url);
  const { items: searchItems } = res.data;
  const data = (searchItems as RepoItem[]).map((item) => {
    return {
      text: item.full_name,
      id: item.full_name,
    };
  });
  return data;
};
export const checkAccess: QueryFunction<
  boolean,
  GenericQueryKey<CheckAccessParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  const { owner, repo } = params;

  let getParams = {
    owner,
    repo,
  };

  let response = await axios.get(`/api/check-access`, {
    params: getParams,
  });

  return response.data;
};

export const getOwnerRepoFromDevServer = async (devServer: string) => {
  const gitConfig = await (await fetch(`${devServer}git.config.json`)).json();
  const url = gitConfig['remote "origin"'].url;
  const [_1, _2, owner, repo] =
    /^(git@github.com:|https:\/\/github.com\/)([^/]*)\/([^/.]*)/.exec(url);
  return { owner, repo };
};

const exampleBlocksOwner = "githubnext";
const exampleBlocksRepo = "blocks-examples";
const getBlocksRepoFromDevServer = async ({
  devServerInfo,
  user,
  path,
  type,
  searchTerm,
}: BlocksReposParams & {
  user: Session["user"];
}) => {
  const blocks = await (
    await fetch(`${devServerInfo.devServer}blocks.config.json`)
  ).json();
  const { owner, repo } = devServerInfo;

  const filter = filterBlock({
    user,
    repo,
    owner,
    path,
    type,
    searchTerm,
    excludeExampleBlocks: false,
  });
  const filteredBlocks = (blocks || []).filter(filter).map((block: Block) => ({
    ...block,
    owner,
    repo,
  }));

  return {
    owner,
    repo,
    blocks: filteredBlocks,
    full_name: `${owner}/${repo}`,
    // we don't use any of the below at the moment
    html_url: "",
    description: "",
    stars: 0,
    watchers: 0,
    language: "",
    topics: [""],
  };
};

export const getBlocksRepos: QueryFunction<
  BlocksRepoWithIsAllowed[],
  GenericQueryKey<BlocksReposParams>
> = async (ctx) => {
  let meta = ctx.meta as BlocksQueryMeta;
  const { queryClient } = meta;
  let { queryKey } = ctx;
  const params = queryKey[1];
  const { path, searchTerm, repoUrl, type, allowList, devServerInfo } = params;

  let repos = [];
  // allow user to search for Blocks on a specific repo
  const isSearchTermUrl = !!repoUrl;
  if (isSearchTermUrl) {
    const [searchTermOwner, searchTermRepo] = (repoUrl || "")
      .split("/")
      .slice(3);
    const repo = await queryClient.fetchQuery(
      QueryKeyMap.info.factory({
        owner: searchTermOwner,
        repo: searchTermRepo,
      }),
      getRepoInfo,
      {
        staleTime: 5 * 60 * 1000,
      }
    );
    repos = [repo];
  } else {
    const query = [
      "topic:github-blocks",
      // we'll need to filter the search when the list is longer than a page
      // params.searchTerm ? `${params.searchTerm} in:readme` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const data = await queryClient.fetchQuery(
      QueryKeyMap.repoSearch.factory({
        q: query,
        order: "desc",
        sort: "updated",
        per_page: 100,
      }),
      searchForRepos,
      {
        staleTime: 5 * 60 * 1000,
      }
    );
    repos = data;
  }

  let devServerBlocksRepo = null;
  if (devServerInfo) {
    const devServerBlocksRepoRes = await queryClient.fetchQuery(
      QueryKeyMap.blocksRepo.factory({
        owner: devServerInfo.owner,
        repo: devServerInfo.repo,
        path,
        type,
        searchTerm,
        devServerInfo,
      }),
      getBlocksFromRepo,
      { staleTime: 5 * 60 * 1000 }
    );
    devServerBlocksRepo = {
      ...devServerBlocksRepoRes,
      isDev: true,
      stars: 0,
      watchers: 0,
      lastRelease: null,
    };
  }
  const nonDevBlocksRepos = (
    await Promise.all(
      repos.map(async (repo, i) => {
        if (
          devServerInfo &&
          devServerInfo.owner === repo.owner.login &&
          devServerInfo.repo === repo.name
        ) {
          // don't include dev server blocks
          return {
            blocks: [],
          } as BlocksRepo;
        }

        const blockRepo = await queryClient.fetchQuery(
          QueryKeyMap.blocksRepo.factory({
            owner: repo.owner.login,
            repo: repo.name,
            path,
            type,
            searchTerm,
          }),
          getBlocksFromRepo,
          { staleTime: 5 * 60 * 1000 }
        );
        const repoInfo = repos[i];
        return {
          ...blockRepo,
          stars: repoInfo?.stargazers_count,
          watchers: repoInfo?.watchers_count,
          lastRelease: repoInfo?.updated_at,
          isDev: false,
        };
      })
    )
  )
    .map((blockRepo) => {
      if (!allowList) return blockRepo;
      return {
        ...blockRepo,
        blocks: blockRepo.blocks.map((block) => {
          return {
            ...block,
            isAllowed: !allowList || isBlockOnAllowList(allowList, block),
          };
        }),
      };
    })
    .sort((a, b) => {
      // list allow list first
      if (
        allowList &&
        a.blocks.some((block: BlockWithIsAllowed) => block.isAllowed)
      ) {
        return -1;
      }

      // list example repo next
      if (a.full_name === `${exampleBlocksOwner}/${exampleBlocksRepo}`) {
        return -1;
      }

      return b.stars - a.stars;
    });

  const blocksRepos = [
    ...(devServerBlocksRepo ? [devServerBlocksRepo] : []),
    ...nonDevBlocksRepos,
  ];

  return blocksRepos.filter((repo) => repo.blocks?.length);
};

export const isBlockOnAllowList = (allowList: AllowBlock[], block: Block) => {
  if (!allowList) return false;
  // always allow these example blocks
  if (
    block.owner === "githubnext" &&
    block.repo === "blocks-examples" &&
    ["code-block", "minimap"].includes(block.id)
  )
    return true;
  return allowList.some((allowBlock) => {
    return doesAllowBlockMatch(allowBlock, block);
  });
};

export const doesAllowBlockMatch = (allowBlock: AllowBlock, block: Block) => {
  return ["owner", "repo", "id"].every((key) => {
    if (!allowBlock[key]) return false;
    return pm([allowBlock[key]], { bash: true, dot: true })(block[key]);
  });
};
