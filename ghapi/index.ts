import { Octokit } from "@octokit/rest";
import { Endpoints } from "@octokit/types";
import axios, { AxiosInstance } from "axios";
import { Base64 } from "js-base64";
import {
  BranchesKeyParams,
  FileKeyParams,
  FilesKeyParams,
  FolderKeyParams,
  GenericQueryKey,
  InfoKeyParams,
  TimelineKeyParams,
} from "lib/query-keys";
import { QueryFunction } from "react-query";
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

export function makeGitHubAPIInstance(token) {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `token ${token}`,
    },
  });
}

export function makeOctokitInstance(token) {
  return new Octokit({ auth: token });
}

interface BlocksQueryMeta {
  ghapi: AxiosInstance;
  octokit: Octokit;
}

export const getFileContent: QueryFunction<
  FileData,
  GenericQueryKey<FileKeyParams>
> = async (ctx) => {
  let meta = ctx.meta as unknown as BlocksQueryMeta;
  let params = ctx.queryKey[1];
  const { path, owner, repo, fileRef = "main" } = params;
  const query = fileRef && fileRef !== "HEAD" ? `?ref=${fileRef}` : "";
  const apiUrl = `repos/${owner}/${repo}/contents/${path}${query}`;

  const file = path.split("/").pop() || "";

  const context = {
    download_url: apiUrl,
    file,
    path: path,
    repo: repo,
    owner: owner,
    sha: fileRef || "",
    username: "mona",
  };

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

  return {
    content,
    context,
  };
};

export async function getMainBranch(
  params: RepoContextWithToken
): Promise<string> {
  const { repo, owner, token } = params;

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/branches/main`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: token && `token ${token}`,
    },
  });
  if (res.status !== 200) {
    throw new Error(
      `Error fetching main branch: ${owner}/${repo}\n${await res.text()}`
    );
  }

  const resObject = await res.json();
  return resObject.name;
}
export async function getLatestSha(
  params: RepoContextWithToken
): Promise<string> {
  const { repo, owner, token } = params;

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/branches/main`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: token && `token ${token}`,
    },
  });
  if (res.status !== 200) {
    throw new Error(
      `Error fetching main branch: ${owner}/${repo}\n${await res.text()}`
    );
  }

  const resObject = await res.json();
  return resObject.commit.sha;
}

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
  const contributorsRes = await meta.ghapi.get(contributorsUrl);

  return { ...repoInfoRes.data, contributors: contributorsRes.data };
};

export const getRepoTimeline: QueryFunction<
  RepoTimeline,
  GenericQueryKey<TimelineKeyParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  let meta = ctx.meta as unknown as BlocksQueryMeta;
  const { owner, repo, sha, path } = params;

  const randomQueryParamName = `${Math.random()}`;

  const url = `repos/${owner}/${repo}/commits?path=${path}&${randomQueryParamName}=""&sha=${
    sha || "HEAD"
  }`;

  const commitsRes = await meta.ghapi(url);

  const commits = commitsRes.data.map((commit) => ({
    date: commit.commit.author.date,
    username: commit.author?.login,
    message: commit.commit.message,
    url: commit.html_url,
    sha: commit.sha,
  }));

  return { commits };
};

export const getRepoFiles: QueryFunction<
  RepoFiles,
  GenericQueryKey<FilesKeyParams>
> = async (ctx) => {
  let params = ctx.queryKey[1];
  let meta = ctx.meta as unknown as BlocksQueryMeta;
  const { owner, repo, sha } = params;
  if (!owner || !repo) {
    return [];
  }

  const url = `repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;

  const fileTreeRes = await meta.ghapi(url);

  const files = fileTreeRes.data.tree;
  return files;
};

type BranchesResponse =
  Endpoints["GET /repos/{owner}/{repo}/branches"]["response"];
export type Branch = BranchesResponse["data"][0];

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

export async function getRepoInfo(
  params: RepoContextWithToken
): Promise<string> {
  const { repo, owner, token } = params;

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: token && `token ${token}`,
    },
  });
  if (res.status !== 200) {
    throw new Error(
      `Error fetching repo info: ${owner}/${repo}\n${await res.text()}`
    );
  }

  const resObject = await res.json();
  return resObject;
}

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
