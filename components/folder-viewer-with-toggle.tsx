import { RepoContext, RepoFiles } from "ghapi";
import { SandboxedFileViewer } from "components/sandboxed-file-viewer";
import { useMetadata } from "hooks";
import { Session } from "next-auth";
import React, { useMemo } from "react";
import { ErrorBoundary } from "./error-boundary";


interface FolderViewerProps {
  allFiles: RepoFiles;
  theme: string;
  viewerContext: RepoContext;
  context: {
    owner: string;
    repo: string;
    path: string;
    fileRef: string;
  };
  dependencies: Record<string, string>;
  viewer: Viewer;
  session: Session;
}

export function FolderViewer(props: FolderViewerProps) {
  const { context, theme, viewer, dependencies, allFiles, session, viewerContext } = props;
  const { repo, owner, path, fileRef } = context;

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    // TODO: Make unique repo
    metadataPath: viewer.title && `.github/viewers/folder/${viewer.title}`,
    filePath: path,
    token: session.token as string,
  });

  const data = useMemo(
    () => allFiles.filter((d) => d.path.startsWith(path)),
    [allFiles, path]
  );

  const name = path.split("/").pop();

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <SandboxedFileViewer
            viewer={viewer}
            meta={{
              theme,
              name,
              download_url: "",
              repo,
              owner,
              path,
              sha: fileRef,
              username: session.user.name,
            }}
            viewerContext={viewerContext}
            dependencies={dependencies}
            tree={data}
            metadata={metadata}
            // @ts-ignore
            onUpdateMetadata={onUpdateMetadata}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
