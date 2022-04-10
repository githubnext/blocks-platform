import React from "react";
import { FileContext, FolderContext } from "@githubnext/utils";
import { RepoFiles } from "ghapi";

type IFramedBlockProps = {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  metadata: any;
  onUpdateMetadata: (
    newMetadata: any,
    path: string,
    block: Block,
    currentMetadata: any
  ) => void;
  onRequestUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (
    path: string,
    params?: Record<string, any>
  ) => Promise<any>;
  onNavigateToPath: (path: string) => void;
};

export default ({
  block,
  contents,
  tree,
  context,
  metadata,
  onUpdateMetadata,
  onRequestUpdateContent,
  onRequestGitHubData,
  onNavigateToPath,
}: IFramedBlockProps) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!iframeRef.current) return;
      const { data, source } = event;
      if (source !== iframeRef.current.contentWindow) return;

      switch (data.type) {
        case "loaded":
          source.postMessage(
            {
              type: "set-props",
              props: {
                context,
                content: contents,
                tree,
                metadata,
              },
            },
            "*"
          );
          break;

        case "update-metadata":
          onUpdateMetadata(
            data.metadata,
            data.path,
            data.block,
            data.currentMetadata
          );
          break;

        case "update-file":
          onRequestUpdateContent(data.content);
          break;

        case "navigate-to-path":
          onNavigateToPath(data.path);
          break;

        case "github-data--request":
          onRequestGitHubData(data.path, data.params)
            .then((res) => {
              source.postMessage(
                {
                  type: "github-data--response",
                  data: res,
                },
                "*"
              );
            })
            .catch((e) => {
              source.postMessage(
                {
                  type: "github-data--response",
                  // Error is not always serializable
                  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
                  error: e instanceof Error ? e.message : e,
                },
                "*"
              );
            });
          break;
      }
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      className={"w-full h-full"}
      ref={iframeRef}
      sandbox={"allow-scripts"}
      src={`/block-iframe/${block.owner}/${block.repo}/${block.id}`}
    />
  );
};
