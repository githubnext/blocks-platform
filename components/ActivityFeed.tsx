import { FileContext } from "@githubnext/utils";
import { Box, Label, Link, StyledOcticon, Timeline } from "@primer/components";
import { CommitIcon } from "@primer/octicons-react";
import { useRepoTimeline } from "hooks";
import { getRelativeTime } from "lib/date-utils";
import { useRouter } from "next/router";
import { useState } from "react";
import { Avatar } from "@primer/components";

export const ActivityFeed = ({
  context,
  token,
  commitsIteration,
}: {
  context: Omit<FileContext, "file">;
  token: string;
  commitsIteration: number;
}) => {
  const { owner, repo, path } = context;

  const [open, setOpen] = useState(true);

  const {
    data: timelineData,
    status: timelineStatus,
    error: timelineError,
  } = useRepoTimeline(
    {
      repo: repo,
      owner: owner,
      token,
      path: path,
    },
    {
      // for updating on file changes
      queryKey: [commitsIteration],
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
          className="flex-none py-3 !border-gray-200"
        >
          <div
            className="cursor-pointer flex align-center ml-4 mr-4"
            onClick={() => setOpen(!open)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${
                open ? "rotate-180" : ""
              } transition duration-200 ease-in-out text-gray-600`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </div>
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
    <button
      className={`text-left px-2 cursor-pointer ${
        isSelected ? "bg-[#0A69DA] text-white" : "hover:bg-indigo-50"
      }`}
      onClick={() => {
        let { fileRef, ...newQuery } = router.query;
        if (!isSelected) newQuery.fileRef = sha;
        router.push({
          pathname: router.pathname,
          query: newQuery,
        });
      }}
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
          <div className={`flex justify-between -mt-1`}>
            <Box sx={{ mr: 2, mt: 1 }}>
              <Box
                display="inline"
                sx={{ fontWeight: "bold", color: "inherit", mr: 1 }}
              >
                {username}
              </Box>
              <span className="opacity-80">pushed a commit</span>
            </Box>
            <div className="flex-shrink-0">
              <Avatar
                src={`https://avatars.githubusercontent.com/${username}`}
                alt={username}
              />
            </div>
          </div>

          <Box sx={{ mt: 1 }} className="overflow-x-hidden markdown">
            <div className="opacity-80 text-xs whitespace-pre">{message}</div>
          </Box>
          <Box fontStyle="italic" mt={1} className="opacity-60">
            {getRelativeTime(new Date(date))}
          </Box>
        </Timeline.Body>
      </Timeline.Item>
    </button>
  );
};
