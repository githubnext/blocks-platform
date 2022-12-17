import type { Context, UpdatedContent } from "./index";
import { ActivityFeed } from "../ActivityFeed";

type HistoryPaneProps = {
  context: Context;
  branchName: string;
  timeline: undefined | RepoTimeline;
  updatedContent: undefined | UpdatedContent;
  clearUpdatedContent: () => void;
  blockType?: "folder" | "file";
};

export function HistoryPane({
  context,
  branchName,
  timeline,
  updatedContent,
  clearUpdatedContent,
  blockType,
}: HistoryPaneProps) {
  return (
    <div className="flex-none h-full border-l border-gray-200">
      <ActivityFeed
        context={context}
        branchName={branchName}
        timeline={timeline}
        updatedContent={updatedContent}
        clearUpdatedContent={clearUpdatedContent}
        blockType={blockType}
      />
    </div>
  );
}
