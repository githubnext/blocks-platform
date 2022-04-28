import { Endpoints } from "@octokit/types";
import { createContext } from "react";

interface AppContext {
  hasRepoInstallation: boolean;
  installationUrl: string;
  permissions: Permissions;
}

export const AppContext = createContext<AppContext>(undefined);

type RepoRes = Endpoints["GET /repos/{owner}/{repo}"]["response"];
export type Permissions = RepoRes["data"]["permissions"];
