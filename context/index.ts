import { createContext } from "react";

interface AppContext {
  hasRepoInstallation: boolean;
}

export const AppContext = createContext<AppContext>(undefined);
