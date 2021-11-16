import { RepoContext } from "ghapi";
import { SandboxedViewerWrapper } from "components/sandboxed-viewer-wrapper";
import { useFileContent, useMetadata } from "hooks";
import { getLanguageFromFilename } from "lib";
import React, { useEffect } from "react";
import { ErrorBoundary } from "./error-boundary";
import { FileContext } from "@githubnext/utils";

interface FileViewerProps {
  theme: string;
  viewerContext: RepoContext;
  context: FileContext;
  dependencies: Record<string, string>;
  viewer: Viewer;
  session: Session;
}

export function FileViewer(props: FileViewerProps) {
  const { context, theme, viewer, dependencies, session, viewerContext } = props;
  const { repo, owner, path, sha } = context;

  const { data } = useFileContent({
    repo: repo,
    owner: owner,
    path: path,
    fileRef: sha,
    token: session.token as string,
  });
  const { name = "", content = "", download_url = "" } = data || {};

  const extension = name.split(".").slice(-1)[0];

  const language = getLanguageFromFilename(name);

  const code = content;

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    // TODO: Make unique repo
    metadataPath: viewer.title && `.github/viewers/file/${viewer.title}`,
    filePath: path,
    token: session.token as string,
  });

  useEffect(() => {
    const onUpdateMetadataEvent = (event: MessageEvent) => {
      // TODO: restrict by event.origin
      if (event.data.codesandbox) return
      if (event.data.type !== "update-metadata") return
      const newMetadata = event?.data?.metadata || {};
      onUpdateMetadata(newMetadata)
    }
    window.addEventListener("message", onUpdateMetadataEvent as EventListener)
    return () => {
      window.removeEventListener("message", onUpdateMetadataEvent as EventListener)
    }
  }, [onUpdateMetadata])


  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <SandboxedViewerWrapper
            viewer={viewer}
            theme={theme}
            context={{ ...context, file: name }}
            viewerContext={viewerContext}
            dependencies={dependencies}
            contents={code}
            metadata={metadata}
            session={session}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
