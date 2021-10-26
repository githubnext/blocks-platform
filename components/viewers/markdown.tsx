import { createContext, useContext, useEffect, useMemo, useState } from "react";
import MDX from '@mdx-js/runtime'
import { timeFormat } from "d3"

import SyntaxHighlighter from "react-syntax-highlighter";
import { ViewerProps } from ".";
import { octokit, useUpdateFileContents } from "hooks";
import { Box, Button, StateLabel } from "@primer/components";
import { ErrorBoundary } from "components/error-boundary";

export const MarkdownContext = createContext<any>({});
export function MarkdownViewer({ contents, meta }: ViewerProps) {
  const [markdown, setMarkdown] = useState(contents);
  const [updatedContent, setUpdatedContent] = useState(contents);
  const [repoInfo, setRepoInfo] = useState({});

  const { mutateAsync } = useUpdateFileContents({
    onSuccess: () => {
      console.log("we did it");
    },
    onError: (e) => {
      console.log("something bad happend", e);
    },
  });

  const isDirty = useMemo(() => updatedContent !== markdown, [updatedContent, markdown]);

  const handleSave = async () => {
    if (!isDirty) return
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
      state: 'all',
      per_page: 100,
      sort: 'updated',
    });
    const releases = await octokit.repos.listReleases({
      owner: meta.owner,
      repo: meta.repo,
      per_page: 100,
    });
    console.log(releases)
    const info = {
      issues: issues.data,
      releases: releases.data,
    }
    setRepoInfo(info);
  }

  useEffect(() => {
    getRepoInfo()
  }, [])

  const scope = {
    ...repoInfo
  }

  return (
    <MarkdownContext.Provider value={scope}>
      <div className="w-full h-full flex items-stretch overflow-hidden">
        <div className="relative flex-1 overflow-y-auto">
          <textarea
            className="w-full h-full p-6 bg-gray-100"
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value)
            }}
          />

          {isDirty && (
            <div className="absolute bottom-2 left-2 shadow-xl">
              <Button
                variant="large" onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </div>
        <div className="flex-1 markdown p-6 overflow-y-auto whitespace-pre-wrap">
          <ErrorBoundary key={markdown}>
            <MDX
              components={components}
              scope={scope}
            >
              {markdown}
            </MDX>
          </ErrorBoundary>
        </div>
      </div>
    </MarkdownContext.Provider>
  )
}
const components = {
  Issues,
  Releases,
  code({ node, inline, className, children }) {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <div className="code">
        <SyntaxHighlighter
          language={match[1]}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={className}>
        {children}
      </code>
    )
  }
}

const formatDate = timeFormat("%B %-d");
const issueStateToStatusMap = {
  closed: "issueClosed",
  open: "issueOpened",
}
function Issues({ num = 3, children }: {
  num: number,
  children?: React.ReactNode
}) {
  const { issues } = useContext(MarkdownContext);
  const filteredIssues = issues.slice(0, num);
  return (
    <div className="mt-3 mb-6">
      <div className="flex space-x-2 overflow-x-auto">
        {filteredIssues.map(issue => (
          <Box bg="canvas.subtle" p={3} key={issue.id} className="relative flex-1">
            <div className="flex justify-between items-center">
              <a className="block text-black text-lg" href={issue.html_url}>{issue.title}</a>
              <StateLabel status={issueStateToStatusMap[issue.state]} variant="small" className="">
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
  )
}
function Releases({ num = 3, children }: {
  num: number,
  children?: React.ReactNode
}) {
  const { releases = [] } = useContext(MarkdownContext);
  const filteredReleases = releases.slice(0, num);
  return (
    <div className="mt-3 mb-6">
      <div className="flex space-x-2 overflow-x-auto">
        {filteredReleases.map(release => (
          <Box bg="canvas.subtle" p={3} key={release.id} className="relative flex-1">
            <div className="flex justify-between items-center">
              <a className="block text-black text-lg" href={release.html_url}>{release.tag_name}</a>
            </div>
            <div className="mt-1 text-sm italic text-gray-600">
              {formatDate(new Date(release.published_at))}
            </div>
            {/* <MDX className="whitespace-pre-wrap truncate">{issue.body}</MDX> */}
          </Box>
        ))}
      </div>
    </div>
  )
}