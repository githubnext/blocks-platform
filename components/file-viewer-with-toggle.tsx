import { Box, Button } from "@primer/components";
import { CodeViewer, viewers } from "components/viewers";
import { useFileContent, useMetadata } from "hooks";
import { getLanguageFromFilename } from "lib";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Session } from "next-auth";
import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "./error-boundary";
import { SandboxedFileViewer } from "components/sandboxed-file-viewer";
import { RepoContext } from "api";

const ViewerPicker = dynamic(() => import("./viewer-picker"), { ssr: false });

interface FileViewerProps {
  theme: string;
  viewerContext: RepoContext;
  context: {
    owner: string;
    repo: string;
    path: string;
    fileRef: string;
  };
  viewer: Viewer;
  hasToggle?: boolean;
  session: Session;
}

export function FileViewer(props: FileViewerProps) {
  const { context, theme, viewer, hasToggle, session, viewerContext } = props;
  const { repo, owner, path, fileRef } = context;

  const { data } = useFileContent({
    repo: repo,
    owner: owner,
    path: path,
    fileRef: fileRef,
    token: session.token as string,
  });
  const { name = "", content = "", download_url = "", sha = "" } = data || {};

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

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <SandboxedFileViewer
            viewer={viewer}
            meta={{
              language,
              theme,
              name,
              download_url,
              repo,
              owner,
              path,
              sha,
              username: session.user.name,
            }}
            viewerContext={viewerContext}
            contents={code}
            metadata={metadata}
            // @ts-ignore
            onUpdateMetadata={onUpdateMetadata}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
