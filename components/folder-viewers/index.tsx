import { SidebarViewer } from "./sidebar";
import { CypressViewer } from "./cypress";

export type File = {
  name: string;
  parent: string;
  path: string;
  size: number;
};
export interface FolderViewerProps {
  files: File[];
  contents: string;
  meta: {
    theme: string;
    download_url: string;
    name: string;
    path: string;
    repo: string;
    owner: string;
    sha: string;
    username: string;
  };
}

export const folderViewers = [
  {
    id: "sidebar",
    label: "Sidebar",
    component: SidebarViewer,
  },
  {
    id: "cypress",
    label: "Cypress",
    component: CypressViewer,
  },
];

export * from "./sidebar";
