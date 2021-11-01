import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MDX from "@mdx-js/runtime";
import { timeFormat } from "d3";

import SyntaxHighlighter from "react-syntax-highlighter";
import { ViewerProps } from ".";
import { octokit, useUpdateFileContents } from "hooks";
import { Avatar, Box, Button, StateLabel } from "@primer/components";
import { ErrorBoundary } from "components/error-boundary";
import { PencilIcon, PlusIcon, XIcon } from "@primer/octicons-react";

export const MarkdownContext = createContext<any>({
  issues: [],
  releases: [],
  commits: [],
});
export function MarkdownViewer({ contents, meta }: ViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [markdown, setMarkdown] = useState(contents);
  const [updatedContent, setUpdatedContent] = useState(contents);
  const [repoInfo, setRepoInfo] = useState({
    issues: [],
    releases: [],
    commits: [],
  });

  const { mutateAsync } = useUpdateFileContents({
    onSuccess: () => {},
    onError: (e) => {},
  });

  const isDirty = useMemo(
    () => updatedContent !== markdown,
    [updatedContent, markdown]
  );

  const handleSave = async () => {
    if (!isDirty) return;
    await mutateAsync({
      content: markdown,
      owner: meta.owner,
      repo: meta.repo,
      path: meta.name,
      sha: meta.sha,
    });
    setUpdatedContent(markdown);
  };

  const getRepoInfo = async () => {
    const issues = await octokit.issues.listForRepo({
      owner: meta.owner,
      repo: meta.repo,
      state: "all",
      per_page: 100,
      sort: "updated",
    });
    const releases = await octokit.repos.listReleases({
      owner: meta.owner,
      repo: meta.repo,
      per_page: 100,
    });
    const commits = await octokit.repos.listCommits({
      owner: meta.owner,
      repo: meta.repo,
      per_page: 100,
    });
    const info = {
      issues: issues.data,
      releases: releases.data,
      commits: commits.data,
    };
    setRepoInfo(info);
  };

  useEffect(() => {
    getRepoInfo();
  }, []);

  const scope = {
    ...repoInfo,
  };

  const inputElement = useRef<HTMLTextAreaElement>(null);
  const onSelectComponent = (componentName) => {
    const currentPosition = inputElement.current.selectionStart;
    const newMarkdown = [
      markdown.slice(0, currentPosition),
      `<${componentName} />\n`,
      markdown.slice(currentPosition),
    ].join("");
    setMarkdown(newMarkdown);
    inputElement.current.focus({ preventScroll: true });
    setTimeout(() => {
      inputElement.current.setSelectionRange(
        currentPosition,
        currentPosition + componentName.length + 4
      );
    });
  };

  return (
    <MarkdownContext.Provider value={scope}>
      <div className="w-full h-full flex items-stretch overflow-hidden">
        {isEditing && (
          <div className="relative flex-1 flex flex-col overflow-y-hidden">
            <div className="flex items-center justify-between flex-none">
              <div className="pl-6  py-2 flex items-center">
                <Button
                  onClick={() => {
                    setIsEditing(false);
                  }}
                >
                  <XIcon /> Finished editing
                </Button>
                {/* <div className=" text-sm font-mono">
                  {meta.path}
                </div> */}

                {isDirty && (
                  <div className="ml-2">
                    <Button variant="small" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
              <ComponentNamesHint onSelect={onSelectComponent} />
            </div>

            <textarea
              ref={inputElement}
              className="w-full h-full p-6 bg-gray-100 focus:outline-none overflow-y-auto"
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value);
              }}
            />
          </div>
        )}
        <div className="flex-1 markdown p-6 overflow-y-auto whitespace-pre-wrap">
          {!isEditing && (
            <Button
              className="absolute -top-4 left-0"
              display="flex"
              onClick={() => setIsEditing(true)}
            >
              <div className="mr-1">
                <PencilIcon />
              </div>
              Edit
            </Button>
          )}
          <div className="max-w-[60em] mx-auto">
            <ErrorBoundary key={markdown}>
              <MDX components={components} scope={scope}>
                {markdown}
              </MDX>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </MarkdownContext.Provider>
  );
}
const components = {
  Issues,
  Releases,
  Commits,
  code({ node, inline, className, children }) {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <div className="code">
        <SyntaxHighlighter language={match[1]}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={className}>{children}</code>
    );
  },
};

const formatDate = timeFormat("%B %-d");
const issueStateToStatusMap = {
  closed: "issueClosed",
  open: "issueOpened",
};
function Issues({
  num = 3,
  children,
}: {
  num: number;
  children?: React.ReactNode;
}) {
  const { issues } = useContext(MarkdownContext);
  const filteredIssues = issues.slice(0, num);
  return (
    <div className="mt-3 mb-6">
      <div className="flex space-x-2 flex-wrap">
        {filteredIssues.map((issue) => (
          <Box
            bg="canvas.subtle"
            p={3}
            key={issue.id}
            className="relative flex-1 min-w-[20em] m-1"
          >
            <div className="flex justify-between items-start">
              <a className="block text-black text-lg" href={issue.html_url}>
                {issue.title}
              </a>
              <StateLabel
                status={issueStateToStatusMap[issue.state]}
                variant="small"
                className=""
              >
                {issue.state}
              </StateLabel>
            </div>
            <div className="mt-1 text-sm italic text-gray-600">
              Last update {formatDate(new Date(issue.updated_at))}
            </div>
            {/* <MDX className="whitespace-pre-wrap truncate">{issue.body}</MDX> */}
          </Box>
        ))}
      </div>
    </div>
  );
}
function Releases({
  num = 3,
  children,
}: {
  num: number;
  children?: React.ReactNode;
}) {
  const { releases = [] } = useContext(MarkdownContext);
  const filteredReleases = releases.slice(0, num);
  return (
    <div className="mt-3 mb-6">
      <div className="flex space-x-2 flex-wrap">
        {filteredReleases.map((release) => (
          <Box
            bg="canvas.subtle"
            p={3}
            key={release.id}
            className="relative flex-1 min-w-[20em] m-1"
          >
            <div className="flex justify-between items-center">
              <a className="block text-black text-lg" href={release.html_url}>
                {release.tag_name}
              </a>
            </div>
            <div className="mt-1 text-sm italic text-gray-600">
              {formatDate(new Date(release.published_at))}
            </div>
            {/* <MDX className="whitespace-pre-wrap truncate">{issue.body}</MDX> */}
          </Box>
        ))}
      </div>
    </div>
  );
}
function Commits({
  num = 2,
  children,
}: {
  num: number;
  children?: React.ReactNode;
}) {
  const { commits = [] } = useContext(MarkdownContext);
  const filteredCommits = commits.slice(0, num);
  return (
    <div className="mt-3 mb-6">
      <div className="flex flex-wrap">
        {filteredCommits.map((commit) => (
          <Box
            bg="canvas.subtle"
            p={3}
            key={commit.sha}
            className="relative flex-1 min-w-[20em] m-1"
          >
            <div className="flex justify-between items-center">
              <a className="block text-black text-lg" href={commit.html_url}>
                {commit.commit.message}
              </a>
            </div>
            {/* author */}
            <Box className="flex items-center mt-1">
              <Avatar src={commit.author.avatar_url} className="mr-2" />
              <div className="flex-1 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {commit.author.login}
                </div>
                <div className="mt-1 text-sm italic text-gray-600">
                  {formatDate(new Date(commit.commit.author.date))}
                </div>
              </div>
            </Box>
            {/* <MDX className="whitespace-pre-wrap truncate">{issue.body}</MDX> */}
          </Box>
        ))}
      </div>
    </div>
  );
}

const componentNames = Object.keys(components).filter(
  (d) => d[0] === d[0].toUpperCase()
);
const ComponentNamesHint = ({ onSelect }) => {
  return (
    <div className="bg-white py-2 px-4">
      {componentNames.map((c) => (
        <button
          key={c}
          className="text-xs text-gray-600 mr-1 px-3 py-2 rounded-full focus:bg-indigo-50 hover:bg-indigo-50"
          onClick={() => onSelect(c)}
        >
          <code>{c}</code>
        </button>
      ))}
      <PlusIcon />
    </div>
  );
};
