import { Box, Link, StyledOcticon, Timeline } from "@primer/components"
import { CommentDiscussionIcon, CommentIcon, EyeIcon, GitPullRequestIcon, IssueOpenedIcon, RepoForkedIcon, RepoPushIcon, StarIcon, TrashIcon } from "@primer/octicons-react"
import { Avatar } from "./Avatar"
import { timeFormat, timeDay, timeWeek, timeMonth, timeYear } from "d3"
import MDX from '@mdx-js/runtime'

type Activity = {
  actor: {
    login: string;
    avatar_url: string;
    display_login: string;
    id: number;
    url: string;
  }
  created_at: string;
  id: string;
  org: {
    login: string;
    url: string;
    avatar_url: string;
    gravatar_id: string;
    id: number;
  }
  payload: {
    action: string;
    issue?: any;
    labels_url?: string;
    comment?: any;
    commits?: any[];
  }
  public: boolean;
  repo: {
    id: number;
    name: string;
    url: string;
  }
  type: "IssuesEvent" | "PullRequestEvent" | "PushEvent" | "WatchEvent" | "DeleteEvent" | "ForkEvent" | "CommitCommentEvent" | "IssueCommentEvent"
}

export const ActivityFeed = ({ activity }: {
  activity: Activity[];
}) => {
  return (
    <div className="h-full overflow-auto">
      <div className="flex flex-col h-full p-4">
        <Timeline>
          {activity.map((item, index) => (
            <Activity {...item} key={item.id} />
          ))}
        </Timeline>
      </div>
    </div>
  )
}

const Activity = ({
  actor,
  created_at,
  id,
  org,
  payload,
  public: isPublic,
  repo,
  type,
}: Activity) => {

  const icon = {
    IssuesEvent: IssueOpenedIcon,
    PullRequestEvent: GitPullRequestIcon,
    PushEvent: RepoPushIcon,
    WatchEvent: StarIcon,
    DeleteEvent: TrashIcon,
    ForkEvent: RepoForkedIcon,
    CommitCommentEvent: CommentDiscussionIcon,
    IssueCommentEvent: CommentIcon,
  }[type]

  const actionText = {
    IssuesEvent: "opened an issue",
    PullRequestEvent: "opened a pull request",
    PushEvent: <>pushed to <Link href={repo.url}>{repo.name}</Link></>,
    WatchEvent: "starred this repo",
    DeleteEvent: <>deleted <Link href={repo.url}>{repo.name}</Link></>,
    ForkEvent: <>forked <Link href={repo.url}>{repo.name}</Link></>,
    CommitCommentEvent: <>commented on <Link href={payload.comment?.html_url}>{payload.comment?.commit_id?.substring(0, 7)}</Link></>,
    IssueCommentEvent: <>commented on issue <Link href={payload.issue?.html_url}>#{payload.issue?.number}</Link></>,
  }[type] || type

  return (
    <Timeline.Item>
      <Timeline.Badge>
        {icon && <StyledOcticon icon={icon} />}
      </Timeline.Badge>
      <Timeline.Body>
        {/* <Box bg="canvas.subtle" borderRadius={10} p={3} m={1} className="flex"> */}
        <div className="flex justify-between -mt-1">
          {/* {type} */}
          <Box sx={{ mr: 2, mt: 1 }} overflow="hidden">
            <Link display="inline" href={actor.url} sx={{ fontWeight: 'bold', color: "fg.default", mr: 1 }} muted>
              {actor.display_login}
            </Link>
            <span className="text-gray-500 overflow-x-hidden">
              {actionText || ""}
            </span>
          </Box>
          <Avatar username={actor.login} />
        </div>

        {type === "IssuesEvent" ? (
          <Box sx={{ mt: 1 }} className="overflow-x-hidden markdown">
            <Link display="inline" href={payload.issue.html_url} sx={{ fontWeight: 'bold', color: "fg.default", mr: 1 }} muted>
              {payload.issue.title}
            </Link>
            <MDX className="text-gray-500 text-xs whitespace-pre">
              {payload.issue.body}
            </MDX>
          </Box>
        ) : type === "CommitCommentEvent" ? (
          <Box sx={{ mt: 1 }} className="overflow-x-hidden markdown">
            <MDX className="text-gray-500 text-xs whitespace-pre">
              {payload.comment?.body}
            </MDX>
          </Box>
        ) : type === "IssueCommentEvent" ? (
          <Box sx={{ mt: 1 }} className="overflow-x-hidden markdown">
            <MDX className="text-gray-500 text-xs whitespace-pre">
              {payload.comment?.body}
            </MDX>
          </Box>
        ) : type === "PushEvent" ? (
          <Box sx={{ mt: 1 }} className="overflow-x-hidden font-semibold text-gray-900">
            {payload.commits?.[0]?.message}
          </Box>
        ) : null}

        <Box fontStyle="italic" mt={1} className="text-gray-400">
          {getRelativeTime(new Date(created_at))}
        </Box>
        {/* </Box> */}
      </Timeline.Body>
    </Timeline.Item>
  )
}


const getOrdinal = n => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
};
const formatDate = d => ([
  timeFormat("%B %-d")(d),
  getOrdinal(+timeFormat("%d")(d)),
  timeFormat(", %Y")(d),
].join(''));
const formatTime = timeFormat("%-I:%M %p")
const getRelativeTime = d => {
  const today = timeDay.floor(new Date());
  if (d > today) {
    return formatTime(d)
  }
  const yesterday = timeDay.offset(today, -1);
  if (d > yesterday) {
    return `Yesterday, ${formatTime(d)}`
  }
  const thisWeek = timeWeek.floor(new Date());
  if (d > thisWeek) {
    return timeFormat("%A")(d)
  }
  const lastWeek = timeWeek.offset(thisWeek, -1);
  if (d > lastWeek) {
    return `Last ${timeFormat("%A")(d)}`
  }
  const thisMonth = timeMonth.floor(new Date());
  if (d > thisMonth) {
    const daysAgo = timeDay.count(thisMonth, d);
    return `${daysAgo} days ago`
  }
  const thisYear = timeYear.floor(new Date());
  if (d > thisYear) {
    const monthsAgo = timeMonth.count(thisYear, d);
    return `${monthsAgo} months ago`
  }
  const yearsAgo = timeYear.count(new Date(0), d);
  return `${yearsAgo} years ago`
}