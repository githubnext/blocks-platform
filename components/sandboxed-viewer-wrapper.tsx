import { getFileContent, RepoContext, RepoFiles } from "ghapi";
import { useCallback, useMemo } from "react";
import { FileContext, FolderContext } from "@githubnext/utils";
import { SandboxedViewer } from "@githubnext/utils";

interface SandboxedViewerWrapperProps {
  viewer: Viewer;
  viewerContext: RepoContext;
  contents?: string;
  theme: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  dependencies: Record<string, string>;
  metadata: any;
  session: Session;
}

export function SandboxedViewerWrapper(props: SandboxedViewerWrapperProps) {
  const { viewer, viewerContext, metadata, contents, theme, tree, dependencies, context, session } = props;

  const getFileContentForPath = useCallback(async (path: string) => {
    const res = await getFileContent({
      repo: viewerContext.repo,
      owner: viewerContext.owner,
      fileRef: "main",
      token: "",
      path
    })
    return res.content;
  }, [context.repo, context.owner, context.sha, session.token]);

  const fileContext = {
    ...context,
    theme,
  } as any

  if ((!contents && viewer.type === "file")
    || (!tree && viewer.type === "tree")) {
    return null
  }

  return (
    <div className="sandbox-wrapper h-full w-full">
      <SandboxedViewer
        getFileContent={getFileContentForPath}
        contents={contents}
        tree={tree}
        context={fileContext}
        dependencies={dependencies}
        viewer={viewer}
        metadata={metadata}
        session={session}
      />
    </div>
  );
}