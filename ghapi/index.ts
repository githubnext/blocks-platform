import parseStaticImports from "parse-static-imports";

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
}

export interface UseFolderContentParams extends RepoContextWithToken {
  path: string;
  fileRef?: string;
}

export async function getFileContent(
  params: UseFileContentParams
): Promise<FileData> {
  const { repo, owner, path, fileRef, token } = params;

  const apiUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${fileRef}/${path}`;
  const res = await fetch(apiUrl);
  if (res.status !== 200) throw new Error("Something bad happened");

  const content = await res.text();

  const context = {
    download_url: apiUrl,
    file: path.split("/").pop() || "",
    path: path,
    repo: repo,
    owner: owner,
    sha: fileRef || "",
    username: "mona",
  };

  return {
    content,
    context,
  };
}

type Import = {
  moduleName: string;
  starImport: string;
  namedImports: {
    name: string;
    alias: string;
  }[];
  defaultImport: string;
  sideEffectOnly: boolean;
};

const combinePaths = (path1: string, path2: string): string => {
  return path1.split("/").slice(0, -1).join("/") + path2.slice(1);
};

export async function getFileContentsAndDependencies(
  params: UseFileContentParams
): Promise<FileData[]> {
  const { repo, owner, path, fileRef, token } = params;

  const file = await getFileContent(params);
  const imports = await parseStaticImports(file.content);
  // TODO: do we need to make this smarter?
  const relativeImports = imports.filter((d: Import) =>
    d.moduleName.startsWith(".")
  );
  let otherFiles = [];
  for (const relativeImport of relativeImports) {
    const filePath = relativeImport.moduleName;
    const absoluteFilePath = combinePaths(path, filePath);
    const fileParams = {
      ...params,
      path: absoluteFilePath,
    };
    const importFileData = await getFileContentsAndDependencies(fileParams);
    otherFiles = [...otherFiles, ...importFileData];
  }

  return [file, ...otherFiles];
}

export async function getFolderContent(
  params: UseFolderContentParams
): Promise<FolderData> {
  const { repo, owner, path, fileRef, token } = params;
  let branch = fileRef || "HEAD";

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${token}`,
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
}

type listRepoFilesResponse =
  Endpoints["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"]["response"];
export type RepoFiles = listRepoFilesResponse["data"]["tree"];

export async function getRepoInfo(
  params: RepoContextWithToken
): Promise<RepoInfo> {
  const { owner, repo, token } = params;
  const url = `/api/repo-info?owner=${owner}&repo=${repo}&token=${token}`;
  const res = await fetch(url);
  if (res.status !== 200) {
    const error = await res.json();
    throw new Error(error.message);
  }
  return await res.json();
}

export async function getRepoFiles(
  params: RepoContextWithToken
): Promise<RepoFiles> {
  const { owner, repo, token } = params;
  const url = `/api/file-tree?owner=${owner}&repo=${repo}&token=${token}`;
  const res = await fetch(url);
  if (res.status !== 200) {
    const error = await res.json();
    throw new Error(error.message);
  }
  const { files } = await res.json();
  return files;
}

import { Endpoints } from "@octokit/types";