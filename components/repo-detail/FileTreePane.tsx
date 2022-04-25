import { AnimatePresence, motion } from "framer-motion";
import type { RepoFiles } from "@githubnext/utils";
import type { UpdatedContents } from "./index";
import { Sidebar } from "../Sidebar";

type FileTreePaneProps = {
  isFullscreen: boolean;
  owner: string;
  repo: string;
  files: undefined | RepoFiles;
  path: string;
  updatedContents: UpdatedContents;
};

export default function FileTreePane({
  isFullscreen,
  owner,
  repo,
  files,
  path,
  updatedContents,
}: FileTreePaneProps) {
  return (
    <AnimatePresence initial={false}>
      {!isFullscreen && (
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: "17rem",
            transition: { type: "tween", duration: 0.1 },
          }}
          exit={{ width: 0, transition: { type: "tween", duration: 0.1 } }}
          className="flex-none w-[17rem] border-r border-gray-200"
        >
          {!files ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
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
              files={files}
              updatedContents={updatedContents}
              activeFilePath={path}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
