import { Octokit } from "@octokit/rest";
import { Endpoints } from "@octokit/types";
import { Base64 } from "js-base64";
import { FolderKeyParams, GenericQueryKey } from "lib/query-keys";
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

export async function getFileContent(
  params: UseFileContentParams
): Promise<FileData> {
  const { repo, owner, path, fileRef, token } = params;

  const query = fileRef && fileRef !== "HEAD" ? `?ref=${fileRef}` : "";
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${query}`;

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

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: token && `token ${token}`,
    },
  });
  if (res.status !== 200) {
    if (res.status === 404) {
      throw new Error(`File not found: ${owner}/${repo}: ${path}`);
    } else {
      throw new Error(
        `Error fetching file: ${owner}/${repo}: ${path}\n${await res.text()}`
      );
    }
  }

  const resObject = await res.json();
  const encodedContent = resObject.content;
  const content = Buffer.from(encodedContent, "base64").toString("utf8");

  return {
    content,
    context,
  };
}

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
  const { repo, owner, path, token, fileRef } = queryKey[0].params;
  let branch = fileRef || "HEAD";

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: token && `token ${token}`,
    },
  });
  const { tree: rawTree } = await res.json();

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

export async function getRepoInfoWithContributors(
  params: RepoContextWithToken
): Promise<RepoInfo> {
  const { owner, repo, token } = params;
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await fetch(url, {
    headers: {
      Authorization: token && `token ${token}`,
    },
  });
  if (res.status !== 200) {
    const error = await res.json();
    throw new Error(error.message);
  }

  const data = await res.json();

  const contributorsUrl = `${url}/contributors`;
  const contributorsRes = await fetch(contributorsUrl, {
    headers: {
      Authorization: token && `token ${token}`,
    },
  });
  const contributors = await contributorsRes.json();

  return { ...data, contributors };
}

export async function getRepoTimeline(
  params: RepoContextWithToken & { path: string; sha?: string }
): Promise<RepoTimeline> {
  const { owner, repo, sha, path, token } = params;

  const randomQueryParamName = `${Math.random()}`;

  const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${path}&${randomQueryParamName}=""&sha=${
    sha || "HEAD"
  }`;

  const commitsRes = await fetch(url, {
    headers: {
      Authorization: token && `token ${token}`,
    },
  });
  const data = await commitsRes.json();

  if (commitsRes.status !== 200) {
    const error = await commitsRes.json();
    throw new Error(error.message);
  }

  const commits = data.map((commit) => ({
    date: commit.commit.author.date,
    username: commit.author?.login,
    message: commit.commit.message,
    url: commit.html_url,
    sha: commit.sha,
  }));

  return { commits };
}

export async function getRepoFiles(
  params: RepoContextWithToken
): Promise<RepoFiles> {
  const { owner, repo, token } = params;
  if (!owner || !repo) {
    return [];
  }

  const branch = "HEAD";
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const fileTreeRes = await fetch(url, {
    headers: {
      Authorization: token && `Bearer ${token}`,
    },
  });
  const fileTree = await fileTreeRes.json();

  if (fileTreeRes.status !== 200) {
    const error = await fileTreeRes.json();
    throw new Error(error.message);
  }
  const files = fileTree.tree;
  return files;
}

type BranchesResponse =
  Endpoints["GET /repos/{owner}/{repo}/branches"]["response"];
export type Branch = BranchesResponse["data"][0];

export async function getBranches(
  params: RepoContextWithToken
): Promise<Branch[]> {
  const { owner, repo, token } = params;
  if (!owner || !repo) {
    return [];
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/branches`;

  const res = await fetch(url, {
    headers: {
      Authorization: token && `Bearer ${token}`,
    },
  });

  if (res.status !== 200) {
    const error = await res.json();
    throw new Error(error.message);
  }

  const data = await res.json();
  return data;
}

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

export type CreateBranchResponse = string;

export async function createBranchAndPR(
  params: CreateBranchParams
): Promise<string> {
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
  return res.data.html_url;
}
