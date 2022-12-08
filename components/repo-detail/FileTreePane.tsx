import type { RepoFiles } from "@githubnext/blocks";
import type { UpdatedContents } from "./index";
import { Sidebar } from "../Sidebar";

type FileTreePaneProps = {
  owner: string;
  repo: string;
  branchName: string;
  files: undefined | RepoFiles;
  path: string;
  updatedContents: UpdatedContents;
};

export default function FileTreePane({
  owner,
  repo,
  branchName,
  files,
  path,
  updatedContents,
}: FileTreePaneProps) {
  return (
    <>
      {!files ? (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="animate-pulse flex space-y-4">
            <div className="rounded-full bg-gray-200 h-12 w-full"></div>
            <div className="rounded-full bg-gray-200 h-12 w-full"></div>
            <div className="rounded-full bg-gray-200 h-12 w-full"></div>
          </div>
        </div>
      ) : (
        <Sidebar
          owner={owner}
          repo={repo}
          branchName={branchName}
          files={files}
          updatedContents={updatedContents}
          activeFilePath={path}
        />
      )}
    </>
  );
}
