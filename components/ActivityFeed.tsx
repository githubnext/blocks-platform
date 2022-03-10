import { FileContext } from "@githubnext/utils";
import {
  CommitIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
} from "@primer/octicons-react";
import {
  Avatar,
  Box,
  Label,
  StyledOcticon,
  Text,
  Timeline,
} from "@primer/react";
import { useRepoTimeline } from "hooks";
import { getRelativeTime } from "lib/date-utils";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export const ActivityFeed = ({
  context,
  token,
}: {
  context: Omit<FileContext, "file">;
  token: string;
}) => {
  const { owner, repo, path } = context;

  const [open, setOpen] = useState(true);

  const { data: timelineData } = useRepoTimeline({
    repo: repo,
    owner: owner,
    token,
    path: path,
  });

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
          className="flex-none py-3 !border-gray-200"
        >
          <Box
            color="fg.muted"
            className="cursor-pointer flex align-center ml-4 mr-4"
            onClick={() => setOpen(!open)}
          >
            {open ? <SidebarCollapseIcon /> : <SidebarExpandIcon />}
          </Box>
          <div className="font-semibold text-gray-600 p-px flex max-w-full min-w-0 pr-2">
            <div className="flex-none">Commits</div>
            {path && (
              <Label className="min-w-0 ml-2 flex-1 truncate leading-6" outline>
                {path}
              </Label>
            )}
          </div>
        </Box>
        <Timeline>
          {commits.map((item) => (
            <Commit
              {...item}
              isSelected={context.sha === item.sha}
              key={item.sha}
            />
          ))}
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
}: {
  isSelected: boolean;
  date: string;
  message: string;
  username: string;
  sha: string;
}) => {
  const router = useRouter();
  return (
    <Link
      shallow
      href={{
        query: {
          ...router.query,
          fileRef: sha,
        },
      }}
    >
      <a
        className={`text-left px-2 cursor-pointer overflow-hidden ${
          isSelected ? "bg-[#0A69DA] text-white" : "hover:bg-indigo-50"
        }`}
      >
        <Timeline.Item>
          <Timeline.Badge
            className={`transition-transform ${
              isSelected
                ? "!bg-[#0A69DA] !text-white !border-indigo-200 transform scale-110"
                : ""
            }`}
          >
            <StyledOcticon icon={CommitIcon} />
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
