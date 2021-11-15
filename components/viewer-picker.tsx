import { Button, SelectMenu } from "@primer/components";
import { getViewerFromFilename } from "lib";
import { viewers as fileViewers } from "./viewers";
import { folderViewers } from "./folder-viewers";
import { useEffect } from "react";

interface ViewerPickerProps {
  viewers: Viewer[];
  value: Viewer;
  isFolder?: boolean;
  path: string;
  onChange: (newType: Viewer) => void;
}

export default function ViewerPicker(props: ViewerPickerProps) {
  const { viewers, value, path, isFolder, onChange } = props;
  // const defaultViewer = isFolder ? "sidebar" : (getViewerFromFilename(`.${extension}`) || "code")
  const extension = path.split(".").slice(-1)[0];
  const relevantViewers = viewers.filter(
    (d) => !d.extensions || d.extensions.includes("*") || d.extensions.includes(extension)
  );

  useEffect(() => {
    if (!relevantViewers?.find((v) => v?.entry === value?.entry)) {
      onChange(relevantViewers[0]);
    }
  }, [value, relevantViewers?.map(d => d.entry).join(",")])

  return (
    <SelectMenu>
      <Button ml={3} as="summary">
        Viewer: {value?.title}
      </Button>

      <SelectMenu.Modal>
        <SelectMenu.Header>Viewers</SelectMenu.Header>
        <SelectMenu.List>
          {relevantViewers.map((d) => {
            return (
              <SelectMenu.Item
                as="button"
                key={d.entry}
                onClick={(e) => {
                  onChange(d);
                }}
              >
                {d.title}
              </SelectMenu.Item>
            );
          })}
        </SelectMenu.List>
      </SelectMenu.Modal>
    </SelectMenu>
  );
}
