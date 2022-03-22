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

interface FileKeyParams {
  repo: string;
  owner: string;
  path: string;
  fileRef?: string;
  token: string;
}

type keyNames = "folder" | "info" | "timeline" | "files" | "file";
export type GenericQueryKey<T> = [key: keyNames, params: T];

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
  blocksInfo: () => [{ scope: "blocksInfo" }] as const,
  file: (params: FileKeyParams) => [{ scope: "file", params }] as const,
};
