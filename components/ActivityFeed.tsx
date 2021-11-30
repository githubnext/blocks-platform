import { FileContext } from "@githubnext/utils";
import MDX from "@mdx-js/runtime";
import { Box, Link, StyledOcticon, Timeline } from "@primer/components";
import {
  CommitIcon
} from "@primer/octicons-react";
import { timeDay, timeFormat, timeMonth, timeWeek, timeYear } from "d3";
import { useRepoTimeline } from "hooks";
import { useRouter } from "next/router";
import { Avatar } from "./Avatar";

export const ActivityFeed = ({ context, session }: {
  context: Omit<FileContext, "file">,
  session: Session
}) => {
  const { owner, repo, path } = context;

  const {
    data: timelineData,
    status: timelineStatus,
    error: timelineError,
  } = useRepoTimeline({
    repo: repo,
    owner: owner,
    token: session?.token,
    path: path,
  });

  const commits = timelineData?.commits || [];

  return (
    <div className="h-full overflow-auto">
      <div className="flex flex-col h-full">
        <Timeline>
          {commits.map(item => (
            <Commit {...item} isSelected={context.sha === item.sha} key={item.sha} />
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
  sha
}: {
  isSelected: boolean,
  date: string,
  message: string,
  username: string,
  sha: string
}) => {
  const router = useRouter()
  return (
    <button className={`text-left px-2 cursor-pointer ${isSelected ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-50'}`} onClick={() => {
      let { fileRef, ...newQuery } = router.query
      if (!isSelected) newQuery.fileRef = sha
      router.push({
        pathname: router.pathname,
        query: newQuery
      })
    }
    }>
      <Timeline.Item>
        <Timeline.Badge className={`transition-transform ${isSelected ? '!bg-indigo-500 !text-white !border-indigo-200 transform scale-110' : ''}`}><StyledOcticon icon={CommitIcon} /></Timeline.Badge>
        <Timeline.Body className={`${isSelected ? '!text-white' : ''}`}>
          <div className={`flex justify-between -mt-1`}>
            <Box sx={{ mr: 2, mt: 1 }}>
              <Link
                display="inline"
                href={`http://github.com/${username}`}
                sx={{ fontWeight: "bold", color: "inherit", mr: 1 }}
                muted
                target="_blank"
              >
                {username}
              </Link>
              <span className="opacity-80">pushed a commit</span>
            </Box>
            <Avatar username={username} />
          </div>

          <Box sx={{ mt: 1 }} className="overflow-x-hidden markdown">
            <div className="opacity-80 text-xs whitespace-pre">
              {message}
            </div>
          </Box>
          <Box fontStyle="italic" mt={1} className="opacity-60">
            {getRelativeTime(new Date(date))}
          </Box>
        </Timeline.Body>
      </Timeline.Item>
    </button>
  )
}

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};
const formatDate = (d) =>
  [
    timeFormat("%B %-d")(d),
    getOrdinal(+timeFormat("%d")(d)),
    timeFormat(", %Y")(d),
  ].join("");
const formatTime = timeFormat("%-I:%M %p");
const getRelativeTime = (d) => {
  const now = new Date();
  const today = timeDay.floor(now);
  if (d > today) {
    return formatTime(d);
  }
  const yesterday = timeDay.offset(today, -1);
  if (d > yesterday) {
    return `Yesterday, ${formatTime(d)}`;
  }
  const thisWeek = timeWeek.floor(now);
  if (d > thisWeek) {
    return timeFormat("%A")(d);
  }
  const lastWeek = timeWeek.offset(thisWeek, -1);
  if (d > lastWeek) {
    return `Last ${timeFormat("%A")(d)}`;
  }
  const daysAgo = timeDay.count(d, now);
  if (daysAgo < 30) {
    return `${daysAgo} days ago`;
  }
  const monthsAgo = timeMonth.count(d, now);
  if (monthsAgo < 12) {
    return `${monthsAgo} months ago`;
  }
  const yearsAgo = timeYear.count(new Date(0), d);
  return `${yearsAgo} years ago`;
};
