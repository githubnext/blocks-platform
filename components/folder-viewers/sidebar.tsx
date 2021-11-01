import { Sidebar } from "components/Sidebar";
import { FolderViewerProps } from ".";

export function SidebarViewer(props: FolderViewerProps) {
  const { meta, files } = props;
  console.log(files);

  return (
    <div className={`text-sm code ${meta.theme}`}>
      <Sidebar files={files} />
    </div>
  );
}
