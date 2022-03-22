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
  folder: "folder",
  info: "info",
  timeline: "timeline",
  files: "files",
  file: "file",
  blocksInfo: "blocksInfo",
  branches: "branches",
} as const;

type KeyName = keyof typeof QueryKeyMap;

export type GenericQueryKey<T> = [key: KeyName, params: T];

export const queryKeys = {
  folder: (params: FolderKeyParams): ["folder", FolderKeyParams] => [
    "folder",
    params,
  ],
  info: (params: InfoKeyParams): ["info", InfoKeyParams] => ["info", params],
  timeline: (params: TimelineKeyParams): ["timeline", TimelineKeyParams] => [
    "timeline",
    params,
  ],
  files: (params: FilesKeyParams): ["files", FilesKeyParams] => [
    "files",
    params,
  ],
  blocksInfo: () => ["blocksInfo"],
  file: (params: FileKeyParams): ["file", FileKeyParams] => ["file", params],
  branches: (params: BranchesKeyParams): ["branches", BranchesKeyParams] => [
    "branches",
    params,
  ],
};
