import { Endpoints } from "@octokit/types";
import { createContext } from "react";

export interface AppContextValue {
  hasRepoInstallation: boolean;
  installationUrl: string;
  permissions: Permissions;
  devServerInfo?: DevServerInfo;
}

export const AppContext = createContext<AppContextValue>(undefined);

type RepoRes = Endpoints["GET /repos/{owner}/{repo}"]["response"];
export type Permissions = RepoRes["data"]["permissions"];
