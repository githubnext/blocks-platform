import { FolderViewerProps } from ".";
import { Tree } from "components/Tree"
import { useMemo } from "react";

export function MinimapViewer(props: FolderViewerProps) {
  const { meta, files } = props;
  console.log(files);

  const data = useMemo(() => ({
    children: files
  }), [files])

  return (
    <div className={`text-sm p-8 w-full h-full flex items-center code ${meta.theme}`}>
      <Tree
        data={data}
      // onClickFile={() => {}}
      />
    </div>
  );
}
