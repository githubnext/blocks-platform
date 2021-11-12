import { Box, Button } from "@primer/components";
import { folderViewers, ReadmeViewer } from "components/folder-viewers";
import { useMetadata } from "hooks";
import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import { Session } from "next-auth";

import { ErrorBoundary } from "./error-boundary";

const ViewerPicker = dynamic(() => import("./viewer-picker"), { ssr: false });

interface FolderViewerProps {
  theme: string;
  context: {
    repo: string;
    owner: string;
    path: string;
    fileRef: string;
  };
  viewerOverride?: string;
  defaultViewer?: string;
  hasToggle?: boolean;
  allFiles: {
    path?: string;
    mode?: string;
    type?: string;
    sha?: string;
    size?: number;
    url?: string;
  }[];
  session: Session;
  onSetDefaultViewer: (viewer: string) => void;
}

export function FolderViewer(props: FolderViewerProps) {
  const {
    allFiles,
    theme,
    viewerOverride,
    defaultViewer,
    hasToggle,
    onSetDefaultViewer,
    context,
    session,
  } = props;
  // const { name, content, download_url, sha } = data;

  const [viewerType, setViewerType] = useState(
    viewerOverride || props.defaultViewer
  );
  const { repo, owner, path } = context;

  const viewer = folderViewers.find((d) => d.id === viewerType) || ({} as any);
  const Viewer = viewer.component || ReadmeViewer;

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: `.github/viewers/folder/${viewer.id}`,
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

  const data = useMemo(
    () => allFiles.filter((d) => d.path.startsWith(path)),
    [allFiles, path]
  );

  useEffect(() => {
    setViewerType(defaultViewer);
  }, [path]);

  return (
    <div className="h-full flex flex-col">
      {hasToggle && (
        <div className="flex-none top-0 z-[9999]">
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
                isFolder
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
      )}
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          {!!Viewer && (
            <Viewer
              meta={{ theme, repo, owner, path }}
              files={data}
              metadata={metadata}
              onUpdateMetadata={onUpdateMetadata}
            />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}
