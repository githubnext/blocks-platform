import { DirectoryItem } from "hooks";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { ErrorBoundary } from "./error-boundary";
import { getLanguageFromFilename } from "lib";
import { CodeViewer, viewers } from "components/viewers";
import { Box } from "@primer/components";
import { useRouter } from "next/router";

const ViewerPicker = dynamic(() => import("./viewer-picker"), { ssr: false });

interface FileViewerProps {
  data: DirectoryItem;
  theme: string;
  viewerOverride?: string;
  defaultViewer?: string;
  hasToggle?: boolean;
}

export function FileViewer(props: FileViewerProps) {
  const router = useRouter();
  const { data, theme, viewerOverride, defaultViewer, hasToggle } = props;
  const { name, content, download_url, path, sha } = data;

  const extension = name.split(".").slice(-1)[0];
  const [viewerType, setViewerType] = useState(viewerOverride || props.defaultViewer);
  const { debug, repo, owner, username } = router.query;
  const debugMode = Boolean(debug);

  const language = getLanguageFromFilename(name);

  const code = Buffer.from(content, "base64").toString();
  const viewer = viewers.find((d) => d.id === viewerType) || ({} as any);
  const Viewer = viewer.component || CodeViewer;

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
        <div className="flex-none top-0 z-10">
          <div>
            <Box bg="canvas.subtle" p={2} borderBottom="1px solid" className="!border-gray-200">
              <ViewerPicker extension={extension} onChange={setViewerType} value={viewerType} />
            </Box>
          </div>
        </div>
      )}
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          {!!Viewer && (
            <Viewer
              meta={{ language, theme, name, download_url, repo, owner, path, sha, username }}
              contents={code}
            />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}
