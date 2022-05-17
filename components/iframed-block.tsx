import React, { useEffect, useRef } from "react";
import { BlocksRepo, FileContext, FolderContext } from "@githubnext/utils";
import { RepoFiles } from "ghapi";

type IFramedBlockProps = {
  block: Block;
  contents?: string;
  originalContent?: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  metadata: any;
  isEditable: boolean;
  onUpdateMetadata: (
    newMetadata: any,
    path: string,
    block: Block,
    currentMetadata: any
  ) => void;
  onUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (
    path: string,
    params?: Record<string, any>
  ) => Promise<any>;
  onNavigateToPath: (path: string) => void;
  onRequestBlocksRepos: () => Promise<BlocksRepo[]>;
};

export default ({
  block,
  contents,
  originalContent,
  isEditable,
  tree,
  context,
  metadata,
  onUpdateMetadata,
  onUpdateContent,
  onRequestGitHubData,
  onNavigateToPath,
}: IFramedBlockProps) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const updateIframe = () => {
    if (!iframeRef.current?.contentWindow) return;
    if (!contents && block.type === "file") return;
    if (!tree && block.type === "tree") return;
    iframeRef.current.contentWindow.postMessage(
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
  };
  useEffect(() => {
    updateIframe();
  }, [context, contents, tree, metadata]);

  const onMessage = useRef((event: MessageEvent) => {});
  onMessage.current = (event: MessageEvent) => {
    if (!iframeRef.current) return;
    const { data, origin, source } = event;
    if (source !== iframeRef.current.contentWindow) return;

    switch (data.type) {
      case "loaded":
        updateIframe();
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
        onUpdateContent(data.content);
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
                requestId: data.requestId,
                data: res,
              },
              origin
            );
          })
          .catch((e) => {
            source.postMessage(
              {
                type: "github-data--response",
                requestId: data.requestId,
                // Error is not always serializable
                // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
                error: e instanceof Error ? e.message : e,
              },
              origin
            );
          });
        break;
    }
  };

  React.useEffect(() => {
    const onMessageInstance = (event: MessageEvent) => {
      onMessage.current(event);
    };

    addEventListener("message", onMessageInstance);
    return () => removeEventListener("message", onMessageInstance);
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
