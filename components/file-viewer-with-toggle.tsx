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
  owner: string;
  repo: string;
  path: string;
}

export function FileViewer(props: FileViewerProps) {
  const router = useRouter();
  const { data, theme, viewerOverride, owner, repo, path } = props;
  const { name, content, download_url } = data;
  const [viewerType, setViewerType] = useState(viewerOverride || "code");
  const debugMode = Boolean(router.query.debug);

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

  return (
    <div className="h-full">
      {debugMode && (
        <div className="relative sticky top-0 z-[9999]">
          <div>
            <Box bg="bg.canvas" p={2} borderBottom="1px solid">
              <ViewerPicker onChange={setViewerType} value={viewerType} />
            </Box>
          </div>
        </div>
      )}
      <ErrorBoundary>
        <Viewer
          meta={{ language, theme, name, download_url, owner, repo, path }}
          contents={code}
        />
      </ErrorBoundary>
    </div>
  );
}
