import {
  FileBlockProps,
  FileContext,
  FolderContext,
  RepoFiles,
} from "@githubnext/utils";
import { useGetBlocksInfo, useRepoFiles } from "hooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import components from "./../blocks";

export interface BundleCode {
  name: string;
  content: string;
}
interface ExampleBlockProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext;
  isEmbedded?: boolean;
  onUpdateMetadata: (
    newMetadata: any,
    path: string,
    block: Block,
    currentMetadata: any
  ) => void;
  onRequestUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (
    path: string,
    params?: Record<string, any>,
    id?: string
  ) => Promise<any>;
  onNavigateToPath: (path: string) => void;
}

export function ExampleBlock(props: ExampleBlockProps) {
  const {
    block,
    contents,
    tree,
    metadata = {},
    context,
    isEmbedded = false,
    onUpdateMetadata,
    onRequestUpdateContent,
    onRequestGitHubData,
    onNavigateToPath,
  } = props;

  const Component = components[block.id];

  if (!contents && !tree) return null;

  if (!Component) return <div>No block found for {block.entry}</div>;

  return (
    <div
      className="example-block relative w-full h-full"
      id={`example-block-${block.id}`}
    >
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
import { getMetadataPath } from "./general-block";
type BlockComponentProps = FileBlockProps &
  FolderBlockProps & {
    block: Block;
    path: string;
    tree: RepoFiles;
  };
const BlockComponent = ({
  block,
  path,
  tree,
  onUpdateMetadata,
  onRequestUpdateContent,
  onRequestGitHubData,
  onNavigateToPath,
  ...props
}: BlockComponentProps) => {
  const [contents, setContents] = useState<string | undefined>(undefined);
  const [metadata, setMetadata] = useState<any | undefined>(undefined);

  const getData = async () => {
    if (block.type !== "file") return;
    const apiUrl = `/repos/${props.context.owner}/${props.context.repo}/contents/${path}`;
    const params =
      props.context.sha && props.context.sha !== "HEAD"
        ? { ref: props.context.sha }
        : {};
    const res = await onRequestGitHubData(apiUrl, params);
    const encodedContent = res.content;
    const data = Buffer.from(encodedContent, "base64").toString("utf8");
    setContents(data);
  };
  const getMetadata = async () => {
    if (metadata) return;
    const apiUrl = `/repos/${props.context.owner}/${
      props.context.repo
    }/contents/${getMetadataPath(block, path)}`;
    const res = await onRequestGitHubData(apiUrl, {
      ref: "HEAD",
      cache: new Date().toString(),
    });
    const encodedContent = res.content;
    const content = Buffer.from(encodedContent, "base64").toString("utf8");
    const fullMetadata = JSON.parse((content || "{}") as string) || {};
    setMetadata(fullMetadata);
  };
  useEffect(() => {
    getData();
  }, [path, block.id]);
  useEffect(() => {
    getMetadata();
  }, [path, block.id]);

  useEffect(() => {
    // listen for updated metadata
    const onMessageEvent = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "updated-metadata") {
        getMetadata();
      }
    };
    window.addEventListener("message", onMessageEvent as EventListener);
    return () => {
      window.removeEventListener("message", onMessageEvent as EventListener);
    };
  }, []);

  if (block.type === "file" && !contents)
    return <div className="p-10">Loading...</div>;
  if (!block.id) return null;

  const name = path.split("/").pop();

  return (
    <ErrorBoundary key={path}>
      <ExampleBlock
        block={block}
        context={{ ...props.context, path, file: name, folder: name }}
        contents={contents}
        tree={tree}
        metadata={metadata}
        isEmbedded
        onUpdateMetadata={onUpdateMetadata}
        onNavigateToPath={onNavigateToPath}
        onRequestUpdateContent={onRequestUpdateContent}
        onRequestGitHubData={onRequestGitHubData}
      />
    </ErrorBoundary>
  );
};
