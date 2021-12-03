import { FileBlockProps, FileContext, FolderContext, RepoFiles } from "@githubnext/utils";
import { useGetBlocksInfo, useRepoFiles } from "hooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import components from "./../blocks";

export interface BundleCode { name: string, content: string }
interface ExampleBlockProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext;
  isEmbedded?: boolean;
}

export function ExampleBlock(props: ExampleBlockProps) {
  const {
    block,
    contents,
    tree,
    metadata = {},
    context,
    isEmbedded = false,
  } = props;

  const onUpdateMetadata = useCallback((newMetadata) => {
    if (typeof window === "undefined") return
    window.postMessage({
      type: "update-metadata",
      context,
      metadata: newMetadata,
      path: context.path,
      block,
      current: metadata
    }, "*")
  }, [metadata])
  const onNavigateToPath = useCallback((path) => {
    if (typeof window === "undefined") return
    window.postMessage({
      type: "navigate-to-path",
      context,
      path: path,
    }, "*")
  }, [])
  const onRequestUpdateContent = useCallback((content) => {
    if (typeof window === "undefined") return
    window.postMessage({
      type: "update-file",
      context,
      content,
    }, "*")
  }, [])
  const onRequestGitHubData = useCallback((requestType, config) => {
    if (typeof window === "undefined") return
    const id = uniqueId("github-data--request")
    window.postMessage({
      type: "github-data--request",
      context,
      id,
      requestType,
      config,
    }, "*")

    return new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent) => {
        if (event.data.type !== "github-data--response") return
        if (event.data.id !== id) return
        window.removeEventListener("message", onMessage)
        resolve(event.data.data)
      }
      window.addEventListener("message", onMessage)
      const maxDelay = 1000 * 60 * 5
      window.setTimeout(() => {
        window.removeEventListener("message", onMessage)
        reject(new Error("Timeout"))
      }, maxDelay)
    })

  }, [])

  const Component = components[block.id]

  if (!contents && !tree) return null;

  if (!Component) return (
    <div>
      No block found for {block.entry}
    </div>
  )

  return (
    <div className="w-full h-full" id={`example-block-${block.id}`}>
      <Component
        block={block}
        content={contents || ""}
        tree={tree || []}
        metadata={metadata}
        context={context}
        onUpdateMetadata={onUpdateMetadata}
        onNavigateToPath={onNavigateToPath}
        onRequestUpdateContent={onRequestUpdateContent}
        onRequestGitHubData={onRequestGitHubData}
        BlockComponent={!isEmbedded && BlockComponent}
      />
    </div>
  );
}


import { ErrorBoundary } from "./error-boundary";
import { SandboxedBlockWrapper } from "./sandboxed-block-wrapper";
import { uniqueId } from "lodash";
type BlockComponentProps = FileBlockProps & FolderBlockProps & {
  block: Block,
  path: string,
  tree: RepoFiles,
}
const BlockComponent = ({ block, path, tree, ...props }: BlockComponentProps) => {
  const [contents, setContents] = useState<string | undefined>(undefined)
  const [metadata, setMetadata] = useState<any | undefined>(undefined)

  const getData = async () => {
    if (block.type !== "file") return
    const data = await props.onRequestGitHubData("file-content", {
      owner: props.context.owner,
      repo: props.context.repo,
      path: path,
      fileRef: props.context.fileRef,
    })
    setContents(data.content)
  }
  const getMetadata = async () => {
    if (metadata) return
    const data = await props.onRequestGitHubData("metadata", {
      owner: props.context.owner,
      repo: props.context.repo,
      block: block,
      path: path,
    })
    setMetadata(data)
  }
  useEffect(() => { getData() }, [path, block.id])
  useEffect(() => { getMetadata() }, [path, block.id])

  useEffect(() => {
    // listen for updated metadata
    const onMessageEvent = async (event: MessageEvent) => {
      if (event.data.type === "updated-metadata") {
        console.log("UPDATED")
        getMetadata()
      }
    };
    window.addEventListener("message", onMessageEvent as EventListener);
    return () => {
      window.removeEventListener(
        "message",
        onMessageEvent as EventListener
      );
    };
  }, []);

  if (block.type === "file" && !contents) return (
    <div className="p-10">
      Loading...
    </div>
  )
  if (!block.id) return null

  const name = path.split("/").pop();

  return (
    <ErrorBoundary key={path}>
      <SandboxedBlockWrapper
        block={block}
        theme={"light"}
        context={{ ...props.context, path, file: name, folder: name }}
        contents={contents}
        tree={tree}
        metadata={metadata}
        isEmbedded
      />
    </ErrorBoundary>
  )
}