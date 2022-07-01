import { Session } from "next-auth";

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
  sha: string;
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

export interface CheckAccessParams {
  repo: string;
  owner: string;
}

export interface BlocksKeyParams {
  owner: string;
  repo: string;
  path: string | undefined;
  type: "file" | "folder";
  user: Session["user"];
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
  metadata: makeFactory<"metadata", FileKeyParams>("metadata"),
  blocksRepos: makeFactory<"blocksRepos", {}>("blocksRepos"),
  blocksRepo: makeFactory<"blocksRepo", BlocksKeyParams>("blocksRepo"),
  branches: makeFactory<"branches", BranchesKeyParams>("branches"),
  searchRepos: makeFactory<"searchRepos", string>("searchRepos"),
  blockContent: makeFactory<"blockContent", BlockContentKeyParams>(
    "blockContent"
  ),
  checkAccess: makeFactory<"checkAccess", CheckAccessParams>("checkAccess"),
};

type KeyName = keyof typeof QueryKeyMap;
export type GenericQueryKey<T> = [key: KeyName, params: T];
