import React, { useEffect, useRef } from "react";
import {
  Block,
  BlocksRepo,
  FileContext,
  FolderContext,
} from "@githubnext/blocks";
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
  onStoreGet: (key: string) => Promise<any>;
  onStoreSet: (key: string, value: any) => Promise<void>;
  onNavigateToPath: (path: string) => void;
  onRequestBlocksRepos: () => Promise<BlocksRepo[]>;
};

function handleResponse<T>(
  p: Promise<T>,
  {
    window,
    requestId,
    type,
    origin,
  }: {
    window: Window;
    requestId: string;
    type: string;
    origin: string;
  }
) {
  return p.then(
    (response) => {
      window.postMessage({ type, requestId, response }, "*");
    },
    (e) => {
      // Error is not always serializable
      // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
      const error = e instanceof Error ? e.message : e;
      window.postMessage({ type, requestId, error }, "*");
    }
  );
}

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
  onStoreGet,
  onStoreSet,
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
          block,
          context,
          content: contents,
          originalContent,
          isEditable,
          tree,
          metadata,
        },
      },
      "*"
    );
  };
  useEffect(() => {
    updateIframe();
  }, [block, context, contents, originalContent, isEditable, tree, metadata]);

  const onMessage = useRef((event: MessageEvent) => {});
  onMessage.current = (event: MessageEvent) => {
    if (!iframeRef.current) return;
    const { data, origin, source } = event;
    if (source !== iframeRef.current.contentWindow) return;
    const window = source as Window;

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
        handleResponse(onRequestGitHubData(data.path, data.params), {
          window,
          requestId: data.requestId,
          type: "github-data--response",
          origin,
        });
        break;

      case "store-get--request":
        handleResponse(onStoreGet(data.key), {
          window,
          requestId: data.requestId,
          type: "store-get--response",
          origin,
        });
        break;

      case "store-set--request":
        handleResponse(onStoreSet(data.key, data.value), {
          window,
          requestId: data.requestId,
          type: "store-set--response",
          origin,
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
