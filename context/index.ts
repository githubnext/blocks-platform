import { Endpoints } from "@octokit/types";
import { createContext } from "react";

interface AppContext {
  hasRepoInstallation: boolean;
  installationUrl: string;
  permissions: Permissions;
  token: string | undefined;
  stagedContent: Content;
  setStagedContent: React.Dispatch<React.SetStateAction<StagedContent>>;
  requestedContent: RequestedContent | null;
  setRequestedContent: React.Dispatch<
    React.SetStateAction<RequestedContent | null>
  >;
}

export const AppContext = createContext<AppContext>(undefined);

export type Content = {
  original: string;
  content: string;
  sha: string;
};
export type StagedContent = Record<string, Content>;
export type RequestedContent = {
  path: string;
  newCode: string;
  currentCode?: string;
  onSubmit?: (code: string) => void;
  onClose?: () => void;
};
type RepoRes = Endpoints["GET /repos/{owner}/{repo}"]["response"];
export type Permissions = RepoRes["data"]["permissions"];
