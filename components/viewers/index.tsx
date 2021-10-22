import dynamic from 'next/dynamic'
import { CodeViewer } from "./code";
import { FlatViewer } from "./flat";
import { ThreeDeeViewer } from "./three-dee";
import { IFrameViewer } from "./iframe";
import { CssViewer } from "./css";
import { NotesViewer } from "./notes";
import { ExcalidrawViewer } from "./excalidraw";
const ReactViewer = dynamic(() => import('./react'), { ssr: false })

export interface ViewerProps {
  contents: string;
  meta: {
    language: string;
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

export const viewers = [
  {
    id: "code",
    label: "Code",
    component: CodeViewer,
    extensions: ["*"],
  },
  {
    id: "flat",
    label: "Flat Data",
    component: FlatViewer,
    extensions: ["csv", "json"],
  },
  {
    id: "3d",
    label: "3D",
    component: ThreeDeeViewer,
    extensions: ["glb"],
  },
  {
    id: "iframe",
    label: "Iframe",
    component: IFrameViewer,
    extensions: ["*"],
  },
  {
    id: "css",
    label: "CSS viewer",
    component: CssViewer,
    extensions: ["css", "scss", "sass", "less", "styl", "postcss", "pcss"],
  },
  {
    id: "react",
    label: "React component",
    component: ReactViewer,
    extensions: ["jsx", "js"],
  },
  {
    id: "notes",
    label: "Notes",
    component: NotesViewer,
    extensions: ["notes"],
  },
  {
    id: "excalidraw",
    label: "Excalidraw",
    component: ExcalidrawViewer,
    extensions: ["excalidraw"],
  },
];

export * from "./code";
export * from "./flat";
export * from "./three-dee";
export * from "./iframe";
export * from "./excalidraw";
