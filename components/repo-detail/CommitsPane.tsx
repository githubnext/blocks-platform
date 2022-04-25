import { AnimatePresence, motion } from "framer-motion";
import type { Context, UpdatedContent } from "./index";
import { ActivityFeed } from "../ActivityFeed";

type CommitsPaneProps = {
  isFullscreen: boolean;
  context: Context;
  branchName: string;
  timeline: undefined | RepoTimeline;
  updatedContent: undefined | UpdatedContent;
  clearUpdatedContent: () => void;
};

export default function CommitsPane({
  isFullscreen,
  context,
  branchName,
  timeline,
  updatedContent,
  clearUpdatedContent,
}: CommitsPaneProps) {
  return (
    <AnimatePresence initial={false}>
      {!isFullscreen && (
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: "auto",
            transition: { type: "tween", duration: 0.1 },
          }}
          exit={{ width: 0, transition: { type: "tween", duration: 0.1 } }}
          className="flex-none hidden lg:block h-full border-l border-gray-200"
        >
          <ActivityFeed
            context={context}
            branchName={branchName}
            timeline={timeline}
            updatedContent={updatedContent}
            clearUpdatedContent={clearUpdatedContent}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
