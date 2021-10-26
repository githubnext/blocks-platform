import { createContext, useContext, useEffect, useMemo, useState } from "react";
import remarkMdx from 'remark-mdx'
import MDX from '@mdx-js/runtime'

import SyntaxHighlighter from "react-syntax-highlighter";
import { ViewerProps } from ".";
import { octokit, useUpdateFileContents } from "hooks";
import { Box, Button, StateLabel } from "@primer/components";
import { ErrorBoundary } from "components/error-boundary";

declare global {
  namespace JSX {
    // this merges with the existing intrinsic elements, adding 'my-custom-tag' and its props
    interface IntrinsicElements {
      'Issues': { 'children': string }
      'myCustomTag': { 'children': string }
    }
  }
}
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
    console.log(issues.data);
    const info = {
      issues: issues.data
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
    <div className="mb-6 ">
      <div className="flex space-x-2 overflow-x-auto">
        {filteredIssues.map(issue => (
          <Box bg="canvas.subtle" p={3} key={issue.id} className="relative flex-1">
            <StateLabel status={issueStateToStatusMap[issue.state]} variant="small" className="mb-1">
              {issue.state}
            </StateLabel>
            <a className="block text-black" href={issue.html_url}>{issue.title}</a>
            {/* <MDX className="whitespace-pre-wrap truncate">{issue.body}</MDX> */}
          </Box>
        ))}
      </div>
    </div>
  )
}