import {
  Block,
  BlocksRepo,
  FileBlockProps,
  FileContext,
  FolderContext,
  RepoFiles,
} from "@githubnext/blocks";
import React, { useEffect, useState } from "react";
import components from "./../blocks";
import { SandboxedBlock } from "./sandboxed-block";

export interface BundleCode {
  name: string;
  content: string;
}
interface ExampleBlockProps {
  block: Block;
  contents?: string;
  originalContent?: string;
  isEditable?: boolean;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext;
  isEmbedded?: boolean;
  onUpdateMetadata: (
    newMetadata: any,
    path?: string,
    block?: Block,
    currentMetadata?: any
  ) => void;
  onUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (
    path: string,
    params?: Record<string, any>
  ) => Promise<any>;
  onNavigateToPath: (path: string) => void;
  onStoreGet: (key: string) => Promise<any>;
  onStoreSet: (key: string, value: any) => Promise<void>;
  onRequestBlocksRepos: () => Promise<BlocksRepo[]>;
}

export function ExampleBlock(props: ExampleBlockProps) {
  const {
    block,
    contents,
    originalContent,
    isEditable,
    tree,
    metadata = {},
    context,
    isEmbedded = false,
    onUpdateMetadata,
    onUpdateContent,
    onRequestGitHubData,
    onNavigateToPath,
    onRequestBlocksRepos,
    onStoreGet,
    onStoreSet,
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
        {...{
          // recreate the block if we change file or version
          key: context.sha,
          block,
          content: contents || "",
          originalContent,
          isEditable,
          tree: tree || [],
          metadata,
          context,
          onUpdateMetadata,
          onNavigateToPath,
          onUpdateContent,
          onRequestUpdateContent: onUpdateContent, // for backwards compatibility
          onRequestGitHubData,
          onStoreGet,
          onStoreSet,
          BlockComponent: !isEmbedded && BlockComponent,
          onRequestBlocksRepos,
        }}
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
    onUpdateMetadata: (
      newMetadata: any,
      path?: string,
      block?: Block,
      currentMetadata?: any
    ) => void;
  };
const BlockComponent = ({
  block,
  path,
  tree,
  onUpdateMetadata: originalOnUpdateMetadata,
  onUpdateContent,
  onRequestGitHubData,
  onNavigateToPath,
  onStoreGet,
  onStoreSet,
  onRequestBlocksRepos,
  ...props
}: BlockComponentProps) => {
  const [contents, setContents] = useState<string | undefined>(undefined);
  const [metadata, setMetadata] = useState<any>({});

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
    try {
      const res = await onRequestGitHubData(apiUrl, {
        ref: "HEAD",
      });
      const encodedContent = res.content;
      const content = Buffer.from(encodedContent, "base64").toString("utf8");
      const fullMetadata = JSON.parse((content || "{}") as string) || {};
      setMetadata(fullMetadata);
    } catch (e) {}
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

  const onUpdateMetadata = (newMetadata: any) =>
    originalOnUpdateMetadata(newMetadata, path, block, metadata);

  if (
    "githubnext/blocks-examples" === `${block.owner}/${block.repo}` &&
    block.sandbox === false
  ) {
    return (
      <ErrorBoundary key={path}>
        <ExampleBlock
          {...{
            block,
            context: { ...props.context, path, file: name, folder: name },
            contents,
            originalContent: contents,
            isEditable: false,
            tree,
            metadata,
            isEmbedded: true,
            onUpdateMetadata,
            onNavigateToPath,
            onUpdateContent,
            onRequestGitHubData,
            onStoreGet,
            onStoreSet,
            onRequestBlocksRepos,
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary key={path}>
      <SandboxedBlock
        {...{
          block,
          context: { ...props.context, path, file: name, folder: name },
          contents,
          originalContent: contents,
          isEditable: false,
          tree,
          metadata,
          onUpdateMetadata,
          onNavigateToPath,
          onUpdateContent,
          onRequestGitHubData,
          onStoreGet,
          onStoreSet,
        }}
      />
    </ErrorBoundary>
  );
};
