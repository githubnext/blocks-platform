import { FileContext, FolderContext } from "@githubnext/utils";
import { RepoFiles } from "ghapi";
import { memo, useMemo } from "react";
import { SandboxedBlock } from "components/sandboxed-block";
import { ExampleBlock } from "components/example-block";

interface SandboxedBlockWrapperProps {
  block: Block;
  contents?: string;
  theme: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  metadata: any;
  isEmbedded?: boolean;
  onUpdateMetadata: (
    newMetadata: any,
    path: string,
    block: Block,
    currentMetadata: any
  ) => void;
  onRequestUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (type: string, config: any, id: string) => Promise<any>;
  onNavigateToPath: (path: string) => void;
}

const exampleBlocksRepo = "githubnext/blocks-examples";
export const SandboxedBlockWrapper = memo(function SandboxedBlockWrapper(
  props: SandboxedBlockWrapperProps
) {
  const {
    block,
    metadata,
    contents,
    theme,
    tree,
    context,
    isEmbedded = false,
    onUpdateMetadata,
    onRequestUpdateContent,
    onRequestGitHubData,
    onNavigateToPath,
  } = props;

  const fileContext = useMemo(
    () => ({
      ...context,
      theme,
    }),
    [context, theme]
  );

  if (
    (!contents && block.type === "file") ||
    (!tree && block.type === "tree")
  ) {
    return null;
  }

  if (exampleBlocksRepo === `${block.owner}/${block.repo}`) {
    return (
      <ExampleBlock
        block={block}
        contents={contents}
        tree={tree}
        context={fileContext}
        metadata={metadata}
        isEmbedded={isEmbedded}
        onUpdateMetadata={onUpdateMetadata}
        onRequestUpdateContent={onRequestUpdateContent}
        onRequestGitHubData={onRequestGitHubData}
        onNavigateToPath={onNavigateToPath}
      />
    );
  }

  return (
    <div className="sandbox-wrapper h-full w-full">
      <SandboxedBlock
        block={block}
        contents={contents}
        tree={tree}
        context={fileContext}
        metadata={metadata}
        onUpdateMetadata={onUpdateMetadata}
        onRequestUpdateContent={onRequestUpdateContent}
        onRequestGitHubData={onRequestGitHubData}
        onNavigateToPath={onNavigateToPath}
      />
    </div>
  );
});
