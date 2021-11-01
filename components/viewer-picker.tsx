import { Button, SelectMenu } from "@primer/components";
import { getViewerFromFilename } from "lib";
import { viewers as fileViewers } from "./viewers";
import { folderViewers } from "./folder-viewers";

interface ViewerPickerProps {
  value: string;
  extension?: string;
  isFolder?: boolean;
  onChange: (newType: string) => void;
}

export default function ViewerPicker(props: ViewerPickerProps) {
  const { value, extension, isFolder, onChange } = props;
  const defaultViewer = isFolder ? "sidebar" : (getViewerFromFilename(`.${extension}`) || "code")
  const relevantViewers = (
    isFolder
      ? folderViewers
      : fileViewers.filter(viewer => (
        viewer.extensions.includes(extension) || viewer.extensions.includes("*")
      )))
    .sort((a, b) => (a.id === defaultViewer) ? -1 : 1); // put default viewer first

  return (
    <SelectMenu>
      <Button ml={3} as="summary">Viewer: {value}</Button>

      <SelectMenu.Modal>
        <SelectMenu.Header>Viewers</SelectMenu.Header>
        <SelectMenu.List>
          {relevantViewers.map((d) => {
            return (
              <SelectMenu.Item
                as="button"
                key={d.id}
                onClick={(e) => {
                  onChange(d.id);
                }}
              >
                {d.label}
              </SelectMenu.Item>
            );
          })}
        </SelectMenu.List>
      </SelectMenu.Modal>
    </SelectMenu>
  );
}
