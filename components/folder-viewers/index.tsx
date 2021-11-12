import { SidebarViewer } from "./sidebar";
import { MinimapViewer } from "./minimap";
import { ReadmeViewer } from "./readme";

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
  metadata: any;
  onUpdateMetadata: (metadata: any) => Promise<void>;
}

export const folderViewers = [
  {
    id: "readme",
    label: "Readme",
    component: ReadmeViewer,
  },
  {
    id: "sidebar",
    label: "Sidebar",
    component: SidebarViewer,
  },

  {
    id: "minimap",
    label: "Minimap",
    component: MinimapViewer,
  },
];

export * from "./readme";
