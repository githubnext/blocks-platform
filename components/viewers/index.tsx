import { CodeViewer } from "./code";
import { FlatViewer } from "./flat";
import { IFrameViewer } from "./iframe";

export interface ViewerProps {
  contents: string;
  meta: {
    language: string;
    theme: string;
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
    id: "iframe",
    label: "Iframe",
    component: IFrameViewer,
  },
];

export * from "./code";
export * from "./flat";
export * from "./iframe";

