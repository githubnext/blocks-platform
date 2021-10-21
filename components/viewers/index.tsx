import { CodeViewer } from "./code";
import { FlatViewer } from "./flat";

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
];

export * from "./code";
export * from "./flat";
