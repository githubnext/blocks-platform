import { FileContext, FolderContext, RepoFiles } from "@githubnext/utils";
import React, { useCallback, useMemo } from "react";
import components from "./../blocks";

export interface BundleCode { name: string, content: string }
interface ExampleBlockProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext
}

export function ExampleBlock(props: ExampleBlockProps) {
  const {
    block,
    contents,
    tree,
    metadata = {},
    context,
  } = props;

  const onUpdateMetadata = useCallback((newMetadata) => {
    if (typeof window === "undefined") return
    window.postMessage({
      type: "update-metadata",
      context,
      metadata: newMetadata,
    }, "*")
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
        content={contents}
        tree={tree}
        metadata={metadata}
        context={context}
        onUpdateMetadata={onUpdateMetadata}
      />
    </div>
  );
}
