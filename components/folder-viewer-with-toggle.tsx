import { RepoContext, RepoFiles } from "ghapi";
import { SandboxedViewerWrapper } from "components/sandboxed-viewer-wrapper";
import { useMetadata } from "hooks";
import React, { useMemo } from "react";
import { ErrorBoundary } from "./error-boundary";
import { FolderContext } from "@githubnext/utils";

interface FolderViewerProps {
  allFiles: RepoFiles;
  theme: string;
  viewerContext: RepoContext;
  context: FolderContext;
  dependencies: Record<string, string>;
  viewer: Viewer;
  session: Session;
}

export function FolderViewer(props: FolderViewerProps) {
  const {
    context,
    theme,
    viewer,
    dependencies,
    allFiles,
    session,
    viewerContext,
  } = props;
  const { repo, owner, path, sha } = context;

  const viewerId = `${viewerContext.owner}/${viewerContext.repo}__${viewer.entry}`.replace(/\//g, "__");
  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: viewer.entry && `.github/viewers/folder/${viewerId}`,
    filePath: path,
    token: session.token as string,
  });

  const data = useMemo(
    () => allFiles?.filter((d) => d.path.startsWith(path)),
    [allFiles, path]
  );

  const name = path.split("/").pop();

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <SandboxedViewerWrapper
            viewer={viewer}
            theme={theme}
            context={{ ...context, folder: name }}
            viewerContext={viewerContext}
            dependencies={dependencies}
            tree={data}
            metadata={metadata}
            session={session}
            // @ts-ignore
            onUpdateMetadata={onUpdateMetadata}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
