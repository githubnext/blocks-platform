import { FileContext } from "@githubnext/utils";
import {
  GitCommitIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
} from "@primer/octicons-react";
import { Avatar, Box, IconButton, Label, Text, Timeline } from "@primer/react";
import { Branch } from "ghapi";
import { useRepoTimeline } from "hooks";
import { getRelativeTime } from "lib/date-utils";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export const ActivityFeed = ({
  context,
  branch,
}: {
  context: Omit<FileContext, "file">;
  branch?: Branch;
}) => {
  const router = useRouter();
  const { owner, repo, path } = context;

  const [open, setOpen] = useState(true);

  const { data: timelineData } = useRepoTimeline(
    {
      repo: repo,
      owner: owner,
      sha: branch?.name,
      path: path,
    },
    {
      onSuccess: () => {
        const { fileRef } = router.query;
        if (!fileRef) {
          router.push(
            {
              pathname: router.pathname,
              query: {
                ...router.query,
                fileRef: branch?.name,
              },
            },
            null,
            { shallow: true }
          );
        }
      },
    }
  );

  const commits = timelineData?.commits || [];

  return (
    <div
      className={`h-full overflow-auto ${
        open ? "w-80" : "w-12"
      } transition-width duration-200`}
    >
      <div className="flex flex-col h-full">
        <Box
          bg="canvas.subtle"
          borderBottom="1px solid"
          display="flex"
          alignItems="center"
          p={2}
          borderColor="border.muted"
          flex="none"
        >
          <IconButton
            icon={open ? SidebarCollapseIcon : SidebarExpandIcon}
            onClick={() => setOpen(!open)}
            sx={{ mr: 2 }}
          />
          <Box
            sx={{ fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            <div className="flex-none">Commits</div>
            {path && (
              <Label className="min-w-0 ml-2 flex-1 truncate leading-6">
                {path}
              </Label>
            )}
          </Box>
        </Box>
        <Timeline>
          {commits.map((item, index) => {
            const sha = index ? item.sha : branch?.name;

            return (
              <Commit
                {...item}
                sha={sha}
                defaultSha={branch?.name}
                isSelected={context.sha === sha || context.sha === item.sha}
                key={item.sha}
              />
            );
          })}
        </Timeline>
      </div>
    </div>
  );
};

const Commit = ({
  isSelected,
  date,
  username,
  message,
  sha,
  defaultSha,
}: {
  isSelected: boolean;
  date: string;
  message: string;
  username: string;
  sha: string;
  defaultSha: string;
}) => {
  const router = useRouter();
  return (
    <Link
      shallow
      href={{
        query: {
          ...router.query,
          fileRef: isSelected ? defaultSha : sha,
        },
      }}
    >
      <a
        className={`text-left px-2 cursor-pointer overflow-hidden ${
          isSelected ? "bg-[#0A69DA] text-white" : "hover:bg-indigo-50"
        }`}
      >
        <Timeline.Item>
          <Timeline.Badge>
            <GitCommitIcon />
          </Timeline.Badge>
          <Timeline.Body className={`${isSelected ? "!text-white" : ""}`}>
            <div>
              <Text fontWeight="medium" as="p">
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
                <Text fontSize="12px">{getRelativeTime(new Date(date))}</Text>
              </div>
            </div>
          </Timeline.Body>
        </Timeline.Item>
      </a>
    </Link>
  );
};
