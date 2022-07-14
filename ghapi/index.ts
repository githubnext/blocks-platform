import { Octokit } from "@octokit/rest";
import { Endpoints } from "@octokit/types";
import { components } from "@octokit/openapi-types";
import axios, { AxiosInstance } from "axios";
import { signOut } from "next-auth/react";
import { Base64 } from "js-base64";
import {
  AllBlocksKeyParams,
  BlocksKeyParams,
  BranchesKeyParams,
  CheckAccessParams,
  FileKeyParams,
  FilesKeyParams,
  FolderKeyParams,
  GenericQueryKey,
  InfoKeyParams,
  TimelineKeyParams,
} from "lib/query-keys";
import { QueryFunction, QueryFunctionContext } from "react-query";
import { Block, BlocksRepo } from "@githubnext/blocks";
import { filterBlock } from "../hooks";
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
        signOut();
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export function makeOctokitInstance(token: string) {
  return new Octokit({ auth: token });
}

export interface BlocksQueryMeta {
  token: string;
  ghapi: AxiosInstance;
  octokit: Octokit;
}

export const getFileContent: (
  ctx: QueryFunctionContext<GenericQueryKey<FileKeyParams>>
) => Promise<FileData> = async (ctx) => {
  let meta = ctx.meta as unknown as BlocksQueryMeta;
  let params = ctx.queryKey[1];
  const { path, owner, repo, fileRef = "HEAD" } = params;
  const query = fileRef && fileRef !== "HEAD" ? `?ref=${fileRef}` : "";
  const apiUrl = `repos/${owner}/${repo}/contents/${path}${query}`;

  const file = path.split("/").pop() || "";

  const res = await meta.ghapi(apiUrl);
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
  let meta = ctx.meta as unknown as BlocksQueryMeta;
  const apiUrl = `repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const res = await meta.ghapi.get<FolderData>(apiUrl);

  const { tree: rawTree } = res.data;

  const files = (rawTree as TreeItem[]).filter((item) => {
    return item.path?.includes(path);
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
  let meta = ctx.meta as unknown as BlocksQueryMeta;
  const url = `repos/${owner}/${repo}`;
  const repoInfoRes = await meta.ghapi.get(url);

  const contributorsUrl = `${url}/contributors`;
  try {
    const contributorsRes = await meta.ghapi.get(contributorsUrl);
    return { ...repoInfoRes.data, contributors: contributorsRes.data };
  } catch (e) {
    return { ...repoInfoRes.data, contributors: [] };
  }
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
  let meta = ctx.meta as unknown as BlocksQueryMeta;
  const { owner, repo, sha, path } = params;

  const randomQueryParamName = `${Math.random()}`;

  const url = `repos/${owner}/${repo}/commits?path=${path}&${randomQueryParamName}=""&sha=${sha}`;

  const commitsRes = await meta.ghapi(url);

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
  let meta = ctx.meta as unknown as BlocksQueryMeta;
  const { owner, repo, sha = "HEAD" } = params;
  if (!owner || !repo) {
    return [];
  }

  const url = `repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;

  const fileTreeRes = await meta.ghapi(url);

  const files = fileTreeRes.data.tree;
  return files;
};

export const getBlocksFromRepo: QueryFunction<
  BlocksRepo,
  GenericQueryKey<BlocksKeyParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  let meta = ctx.meta as unknown as BlocksQueryMeta;
  let octokit = meta.octokit;
  return await getBlocksFromRepoInner({ octokit, ...params });
};
export const getBlocksFromRepoInner = async ({
  octokit,
  owner,
  repo,
  path,
  type,
  user,
}: BlocksKeyParams & {
  octokit: Octokit;
}): Promise<BlocksRepo> => {
  if (!owner || !repo) {
    return undefined;
  }

  let blocks = [];
  try {
    const blocksConfigRes = await tryToGetContent(octokit, {
      owner,
      repo,
      path: "blocks.config.json",
    });
    if (blocksConfigRes) {
      blocks =
        JSON.parse(
          Buffer.from(blocksConfigRes.content, "base64").toString("utf8")
        ) ?? [];
    }

    if (!blocks.length) {
      // check package.json for backwards compatibility
      const packageJsonRes = await tryToGetContent(octokit, {
        owner,
        repo,
        path: "package.json",
      });
      if (packageJsonRes) {
        blocks =
          JSON.parse(
            Buffer.from(packageJsonRes.content, "base64").toString("utf8")
          ).blocks ?? [];
      }
    }
  } catch (e) {}

  const filter = filterBlock({ repo, owner, path, type, user });
  const filteredBlocks = (blocks || []).filter(filter).map((block: Block) => ({
    ...block,
    owner,
    repo,
    // repoId: repoRes.data.id,
  }));

  return {
    owner,
    repo,
    blocks: filteredBlocks,
    full_name: `${owner}/${repo}`,
    id: 0,
    // we don't use any of the below at the moment
    html_url: "",
    description: "",
    stars: 0,
    watchers: 0,
    language: "",
    topics: [""],
  };
};

export const getBranches: QueryFunction<
  Branch[],
  GenericQueryKey<BranchesKeyParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  const { owner, repo } = params;
  let meta = ctx.meta as unknown as BlocksQueryMeta;

  const url = `repos/${owner}/${repo}/branches`;

  const res = await meta.ghapi(url);
  return res.data;
};

export interface CreateBranchParams {
  ref: string;
  token: string;
  owner: string;
  repo: string;
  content: string;
  path: string;
  title?: string;
  body?: string;
}

type PullsResponse = Endpoints["POST /repos/{owner}/{repo}/pulls"]["response"];
export type CreateBranchResponse = PullsResponse["data"];

export async function createBranchAndPR(
  params: CreateBranchParams
): Promise<CreateBranchResponse> {
  const {
    ref,
    token,
    owner,
    repo,
    content,
    path,
    title = `GitHub Blocks: Update ${path}`,
    body = "This is a pull request created programmatically by GitHub Blocks.",
  } = params;
  const octokit = new Octokit({ auth: token });
  // "SHAs" abound in this codebase, so let me explain what's going on.
  // In order to create a new branch (a.k.a "ref"), you need the SHA of the branch you're creating it off of.
  // We're naïvely assuming that the branch you're creating off of is the "main" branch.

  // So let's get the SHA of the "main" branch.
  const currentBranchData = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });

  // Let's also get the SHA of the *file* we're going to use when we commit on the new branch.
  const currentFileData = await octokit.repos.getContent({
    owner,
    repo,
    path,
  });

  // @ts-ignore
  let blobSha = currentFileData.data.sha;

  // Step 1. Create the new branch, using the SHA of the "main" branch as the base.
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${ref}`,
    sha: currentBranchData.data.object.sha,
  });

  // Step 2. Commit the new file to the new branch.
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: `feat: updated ${params.path} programatically`,
    content: Base64.encode(content),
    branch: ref,
    // @ts-ignore
    sha: blobSha,
  });

  // Step 3. Create the PR using "main" as the base.
  const res = await octokit.pulls.create({
    owner,
    repo,
    head: ref,
    base: "main",
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
  let meta = ctx.meta as unknown as BlocksQueryMeta;
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

type getContentParams = Parameters<Octokit["repos"]["getContent"]>[0];
type getContentResult = components["schemas"]["content-file"];
const tryToGetContent = async (
  octokit: Octokit,
  params: getContentParams
): Promise<getContentResult | undefined> => {
  try {
    const res = await octokit.repos.getContent(params);
    // `getContent` returns different types for different kinds of object, but we only ever request files
    return res.data as getContentResult;
  } catch {
    return undefined;
  }
};
export const getAllBlocksRepos: QueryFunction<
  BlocksRepo[],
  GenericQueryKey<AllBlocksKeyParams>
> = async (ctx) => {
  let octokit = (ctx.meta as unknown as BlocksQueryMeta).octokit;
  const repos = await octokit.search.repos({
    q: "topic:github-blocks",
    order: "desc",
    sort: "updated",
    per_page: 100,
  });
  const blocks: Block[][] = await Promise.all(
    repos.data.items.map(async (repo) => {
      const repoInfo = await getBlocksFromRepoInner({
        octokit,
        owner: repo.owner.login,
        repo: repo.name,
        user: ctx.queryKey[1].user,
      });
      return repoInfo?.blocks || [];
    })
  );
  return repos.data.items.map<BlocksRepo>((repo, i) => ({
    owner: repo.owner.login,
    repo: repo.name,
    full_name: repo.full_name,
    id: repo.id,
    html_url: repo.html_url,
    description: repo.description,
    stars: repo.stargazers_count,
    watchers: repo.watchers_count,
    language: repo.language,
    topics: repo.topics,

    blocks: blocks[i].map<Block>((b) => ({
      ...b,
      owner: repo.owner.login,
      repo: repo.name,
      repoId: repo.id,
    })),
  }));
};
