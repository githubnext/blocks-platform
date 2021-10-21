import { CodeViewer } from "./code";
import { FlatViewer } from "./flat";
import { ThreeDeeViewer } from "./three-dee";

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
];

export * from "./code";
export * from "./flat";
export * from "./three-dee";
