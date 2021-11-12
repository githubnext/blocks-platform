import { Box, Button } from "@primer/components";
import { CodeViewer, viewers } from "components/viewers";
import { useFileContent, useMetadata } from "hooks";
import { getLanguageFromFilename } from "lib";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Session } from "next-auth";
import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "./error-boundary";

const ViewerPicker = dynamic(() => import("./viewer-picker"), { ssr: false });

interface FileViewerProps {
  theme: string;
  viewerOverride?: string;
  context: {
    owner: string;
    repo: string;
    path: string;
    fileRef: string;
  };
  defaultViewer?: string;
  hasToggle?: boolean;
  onSetDefaultViewer?: (viewer: string) => void;
  session: Session;
}

export function FileViewer(props: FileViewerProps) {
  const {
    context,
    theme,
    viewerOverride,
    defaultViewer,
    hasToggle,
    onSetDefaultViewer,
    session,
  } = props;
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
  const [viewerType, setViewerType] = useState(
    viewerOverride || props.defaultViewer
  );

  const language = getLanguageFromFilename(name);

  const code = content;
  const viewer = viewers.find((d) => d.id === viewerType) || ({} as any);
  const Viewer = viewer.component || CodeViewer;

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: viewer.id && `.github/viewers/file/${viewer.id}`,
    filePath: path,
    token: session.token as string,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleViewerChange = (e: MessageEvent) => {
      const { data } = e;
      if (data.id !== "selected-viewer") return;

      setViewerType(data.value.id);
    };

    window.addEventListener("message", handleViewerChange);

    return () => {
      window.removeEventListener("message", handleViewerChange);
    };
  }, []);

  useEffect(() => {
    setViewerType(defaultViewer);
  }, [path]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none top-0 z-10">
        <div>
          <Box
            bg="canvas.subtle"
            p={2}
            borderBottom="1px solid"
            className="!border-gray-200"
            display="flex"
            alignItems="center"
          >
            <ViewerPicker
              extension={extension}
              onChange={setViewerType}
              value={viewerType}
            />
            {viewerType !== defaultViewer && (
              <Button
                fontSize="1"
                ml={2}
                onClick={() => onSetDefaultViewer(viewerType)}
              >
                Set as default for all users
              </Button>
            )}
          </Box>
        </div>
      </div>
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          {!!Viewer && (
            <Viewer
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
              contents={code}
              metadata={metadata}
              onUpdateMetadata={onUpdateMetadata}
            />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}
