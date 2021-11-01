import { DirectoryItem } from "hooks";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { ErrorBoundary } from "./error-boundary";
import { MinimapViewer, folderViewers } from "components/folder-viewers";
import { Box } from "@primer/components";
import { useRouter } from "next/router";

const ViewerPicker = dynamic(() => import("./viewer-picker"), { ssr: false });

interface FolderViewerProps {
  data: DirectoryItem[];
  path: string;
  theme: string;
  viewerOverride?: string;
  defaultViewer?: string;
  hasToggle?: boolean;
}

export function FolderViewer(props: FolderViewerProps) {
  const router = useRouter();
  const { data, theme, viewerOverride, path, defaultViewer, hasToggle } = props;
  // const { name, content, download_url, sha } = data;

  const [viewerType, setViewerType] = useState(viewerOverride || props.defaultViewer);
  const { debug, repo, owner, username } = router.query;
  const debugMode = Boolean(debug);

  const viewer = folderViewers.find((d) => d.id === viewerType) || ({} as any);
  const Viewer = viewer.component || MinimapViewer;

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
    setViewerType(defaultViewer)
  }, [path])

  return (
    <div className="h-full flex flex-col">
      {(debugMode || hasToggle) && (
        <div className="flex-none top-0 z-[9999]">
          <div>
            <Box bg="canvas.subtle" p={2} borderBottom="1px solid" className="!border-gray-200">
              <ViewerPicker isFolder onChange={setViewerType} value={viewerType} />
            </Box>
          </div>
        </div>
      )}
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          {!!Viewer && (
            <Viewer
              meta={{ theme, repo, owner, path, username }}
              files={data}
            />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}
