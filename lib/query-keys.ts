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

type keyNames =
  | "folder"
  | "info"
  | "timeline"
  | "files"
  | "file"
  | "blocksInfo";
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
  blocksInfo: () => ["blocksInfo"],
  file: (params: FileKeyParams): ["file", FileKeyParams] => ["file", params],
};
