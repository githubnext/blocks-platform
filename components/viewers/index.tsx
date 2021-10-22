import { CodeViewer } from "./code";
import { FlatViewer } from "./flat";
import { ThreeDeeViewer } from "./three-dee";
import { IFrameViewer } from "./iframe";
import { CssViewer } from "./css";
import { NotesViewer } from "./notes";


export interface ViewerProps {
  contents: string;
  meta: {
    language: string;
    theme: string;
    download_url: string;
    name: string;
  };
}

export const viewers = [
  {
    id: "code",
    label: "Code",
    component: CodeViewer,
  },
  {
    id: "flat",
    label: "Flat Data",
    component: FlatViewer,
  },
  {
    id: "3d",
    label: "3D",
    component: ThreeDeeViewer,
  },
  {
    id: "iframe",
    label: "Iframe",
    component: IFrameViewer,
  },
  {
    id: "css",
    label: "CSS viewer",
    component: CssViewer,
  },
  {
    id: "notes",
    label: "Notes",
    component: NotesViewer,
  },
];

export * from "./code";
export * from "./flat";
export * from "./three-dee";
export * from "./iframe";