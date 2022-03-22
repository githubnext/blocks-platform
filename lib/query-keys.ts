export interface FolderKeyParams {
  repo: string;
  owner: string;
  path: string;
  fileRef?: string;
}

export interface InfoKeyParams {
  repo: string;
  owner: string;
  token: string;
}

interface TimelineKeyParams {
  repo: string;
  owner: string;
  path: string;
}

interface FilesKeyParams {
  repo: string;
  owner: string;
  token: string;
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
  timeline: (params: TimelineKeyParams) =>
    [{ scope: "timeline", params }] as const,
  files: (params: FilesKeyParams) => [{ scope: "files", params }] as const,
  blocksInfo: () => [{ scope: "blocksInfo" }] as const,
  file: (params: FileKeyParams) => [{ scope: "file", params }] as const,
};
