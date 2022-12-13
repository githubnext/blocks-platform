import { FileContext } from "@githubnext/blocks";
import {
  GitCommitIcon,
  SidebarCollapseIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import { Avatar, Box, IconButton, Text, Timeline } from "@primer/react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { getRelativeTime } from "lib/date-utils";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCommitsPane } from "state";
import { Tooltip } from "./Tooltip";

type ActivityFeedProps = {
  context: Omit<FileContext, "file">;
  branchName: string;
  timeline: undefined | RepoTimeline;
  updatedContent: undefined | {};
  clearUpdatedContent: () => void;
  blockType?: "folder" | "file";
};

export const ActivityFeed = ({
  context,
  branchName,
  timeline,
  updatedContent,
  clearUpdatedContent,
  blockType,
}: ActivityFeedProps) => {
  const session = useSession();
  const { toggle } = useCommitsPane();

  return (
    <div className={`h-full overflow-hidden`}>
      <div className="flex flex-col h-full">
        <Box
          bg="canvas.subtle"
          borderBottom="1px solid"
          display="flex"
          alignItems="center"
          p={2}
          borderColor="border.muted"
          flex="none"
          className="h-panelHeader flex-shrink-0"
        >
          <Tooltip placement="top" label="Close Commits Pane">
            <IconButton
              icon={SidebarCollapseIcon}
              onClick={toggle}
              sx={{ mr: 2 }}
              title={"Close Commits Pane"}
            />
          </Tooltip>
          <Box
            sx={{
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div className="flex-none">
              Commits {blockType ? `for this ${blockType}` : ""}
            </div>
          </Box>
        </Box>

        <Box className="relative flex-1 overflow-auto">
          {!open && <div className="absolute inset-0 bg-white z-10"></div>}
          {timeline && (
            <LayoutGroup>
              <Timeline>
                <AnimatePresence initial={false}>
                  {updatedContent && (
                    <motion.div
                      layoutId="ghost-commit"
                      key="ghost-commit"
                      className="z-10"
                    >
                      <Commit
                        username={session.data.user?.name}
                        message={"Working changes"}
                        isSelected={context.sha === branchName}
                        onClickRef={branchName}
                        onRemove={clearUpdatedContent}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                {timeline.map((item, index) => {
                  // When `context.sha === branchName` (i.e. `fileRef` is empty or
                  // set to `branchName`) we show the current version of the file.
                  // If there is updated content for the file, the current version
                  // is the ghost commit; otherwise it is the tip of the selected
                  // branch.
                  //
                  // To make it easier to compare an older version of a file against
                  // the current version, clicking the selected version takes you to
                  // the current version (so you can swap between them with repeated
                  // clicks).

                  const isCurrent = index === 0 && !updatedContent;

                  const isSelected =
                    item.sha === context.sha ||
                    (isCurrent && context.sha === branchName);

                  const onClickRef =
                    isSelected || isCurrent ? branchName : item.sha;

                  return (
                    <motion.div layout layoutId={item.sha} key={item.sha}>
                      <Commit
                        {...item}
                        onClickRef={onClickRef}
                        isSelected={isSelected}
                        key={item.sha}
                      />
                    </motion.div>
                  );
                })}
              </Timeline>
            </LayoutGroup>
          )}
        </Box>
      </div>
    </div>
  );
};

type CommitProps = {
  isSelected: boolean;
  date?: string;
  message: string;
  username: string;
  onClickRef: string;
  onRemove?: () => void;
};

const Commit = ({
  isSelected,
  date,
  username,
  message,
  onClickRef,
  onRemove,
}: CommitProps) => {
  const router = useRouter();
  return (
    <Link
      shallow
      href={{
        query: {
          ...router.query,
          fileRef: onClickRef,
        },
      }}
    >
      <a
        className={`block text-left px-2 cursor-pointer overflow-hidden ${
          isSelected ? "bg-[#0A69DA] text-white" : "hover:bg-indigo-50"
        }`}
      >
        <Timeline.Item>
          {onRemove && (
            <button className="absolute top-2 right-1" onClick={onRemove}>
              <XCircleIcon fill={isSelected ? "white" : ""} size={16} />
            </button>
          )}
          <Timeline.Badge>
            <GitCommitIcon />
          </Timeline.Badge>
          <Timeline.Body className={`${isSelected ? "!text-white" : ""}`}>
            <div>
              <Text
                fontStyle={onRemove ? "italic" : ""}
                fontWeight="medium"
                as="p"
              >
                {message}
              </Text>
              <div className="mt-1 flex items-center gap-1">
                <Avatar
                  size={20}
                  className="!w-[20px] float-none"
                  src={`https://avatars.githubusercontent.com/${username}`}
                  alt={username}
                />

                <Text fontWeight="bold" fontSize="12px" as="span">
                  {username}
                </Text>
                {date && (
                  <Text fontSize="12px">{getRelativeTime(new Date(date))}</Text>
                )}
              </div>
            </div>
          </Timeline.Body>
        </Timeline.Item>
      </a>
    </Link>
  );
};
