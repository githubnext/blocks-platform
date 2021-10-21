import { DirectoryItem } from "hooks";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Box } from "@primer/components";

import { ErrorBoundary } from "./error-boundary";
import { getLanguageFromFilename } from "lib";
import { CodeViewer, viewers } from "components/viewers";
const ViewerPicker = dynamic(() => import("./viewer-picker"), { ssr: false });

interface FileViewerProps {
  data: DirectoryItem;
  theme: string;
}

export function FileViewer(props: FileViewerProps) {
  const { data, theme } = props;
  console.log(data);
  const { name, content, download_url } = data;
  const [viewerType, setViewerType] = useState("code");

  const language = getLanguageFromFilename(name);

  const code = Buffer.from(content, "base64").toString();
  const viewer = viewers.find((d) => d.id === viewerType) || ({} as any);
  const Viewer = viewer.component || CodeViewer;

  return (
    <div className="h-full">
      <div className="relative sticky top-0 z-[9999]">
        <div>
          <Box bg="bg.canvas" p={2} borderBottom="1px solid">
            <ViewerPicker onChange={setViewerType} value={viewerType} />
          </Box>
        </div>
      </div>

      <ErrorBoundary>
        <Viewer
          meta={{ language, theme, name, download_url }}
          contents={code}
        />
      </ErrorBoundary>
    </div>
  );
}
