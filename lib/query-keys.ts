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

export const QueryKeyMap = {
  folder: {
    key: "folder",
    factory: (params: FolderKeyParams): ["folder", FolderKeyParams] => [
      "folder",
      params,
    ],
  },
  info: {
    key: "info",
    factory: (params: InfoKeyParams): ["info", InfoKeyParams] => [
      "info",
      params,
    ],
  },
  timeline: {
    key: "timeline",
    factory: (params: TimelineKeyParams): ["timeline", TimelineKeyParams] => [
      "timeline",
      params,
    ],
  },
  files: {
    key: "files",
    factory: (params: FilesKeyParams): ["files", FilesKeyParams] => [
      "files",
      params,
    ],
  },
  file: {
    key: "file",
    factory: (params: FileKeyParams): ["file", FileKeyParams] => [
      "file",
      params,
    ],
  },
  blocksInfo: {
    key: "blocksInfo",
    factory: () => ["blocksInfo"],
  },
  branches: {
    key: "branches",
    factory: (params: BranchesKeyParams): ["branches", BranchesKeyParams] => [
      "branches",
      params,
    ],
  },
  searchRepos: {
    key: "searchRepos",
    factory: (query: string) => ["searchRepos", query],
  },
} as const;

type KeyName = keyof typeof QueryKeyMap;
export type GenericQueryKey<T> = [key: KeyName, params: T];
