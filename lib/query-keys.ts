export interface FolderKeyParams {
  repo: string;
  owner: string;
  path: string;
  fileRef?: string;
}

export interface InfoKeyParams {
  repo: string;
  owner: string;
}

export interface TimelineKeyParams {
  repo: string;
  owner: string;
  path: string;
  sha?: string;
}

export interface FilesKeyParams {
  repo: string;
  owner: string;
  sha: string;
}

export interface FileKeyParams {
  repo: string;
  owner: string;
  path: string;
  fileRef?: string;
}

export interface BranchesKeyParams {
  repo: string;
  owner: string;
}

export interface BlockContentKeyParams {
  owner: string;
  repo: string;
  id: string;
}

function makeFactory<Key, Params>(
  key: Key
): { key: Key; factory: (params: Params) => [Key, Params] } {
  return {
    key,
    factory: (params: Params) => [key, params],
  };
}

export const QueryKeyMap = {
  folder: makeFactory<"folder", FolderKeyParams>("folder"),
  info: makeFactory<"info", InfoKeyParams>("info"),
  timeline: makeFactory<"timeline", TimelineKeyParams>("timeline"),
  files: makeFactory<"files", FilesKeyParams>("files"),
  file: makeFactory<"file", FileKeyParams>("file"),
  blocksRepos: makeFactory<"blocksRepos", {}>("blocksRepos"),
  branches: makeFactory<"branches", BranchesKeyParams>("branches"),
  searchRepos: makeFactory<"searchRepos", string>("searchRepos"),
  blockContent: makeFactory<"blockContent", BlockContentKeyParams>(
    "blockContent"
  ),
};

type KeyName = keyof typeof QueryKeyMap;
export type GenericQueryKey<T> = [key: KeyName, params: T];
