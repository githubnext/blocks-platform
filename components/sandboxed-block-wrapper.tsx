import { BlocksRepo, FileContext, FolderContext } from "@githubnext/blocks";
import { RepoFiles } from "ghapi";
import { memo, useMemo } from "react";
import { SandboxedBlock } from "components/sandboxed-block";
import { ExampleBlock } from "components/example-block";

interface SandboxedBlockWrapperProps {
  block: Block;
  contents?: string;
  originalContent?: string;
  isEditable?: boolean;
  theme: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  metadata: any;
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

const exampleBlocksRepo = "githubnext/blocks-examples";
export const SandboxedBlockWrapper = memo(function SandboxedBlockWrapper(
  props: SandboxedBlockWrapperProps
) {
  const {
    block,
    metadata,
    contents,
    originalContent,
    isEditable,
    theme,
    tree,
    context,
    isEmbedded = false,
    onUpdateMetadata,
    onUpdateContent,
    onRequestGitHubData,
    onNavigateToPath,
    onStoreGet,
    onStoreSet,
    onRequestBlocksRepos,
  } = props;

  const fileContext = useMemo(
    () => ({
      ...context,
      theme,
    }),
    [context, theme]
  );

  if (
    exampleBlocksRepo === `${block.owner}/${block.repo}` &&
    block.sandbox === false
  ) {
    if (
      (!contents && block.type === "file") ||
      (!tree && block.type === "tree")
    ) {
      return null;
    }

    return (
      <ExampleBlock
        {...{
          block,
          contents,
          originalContent,
          isEditable,
          tree,
          context: fileContext,
          metadata,
          isEmbedded,
          onUpdateMetadata,
          onUpdateContent,
          onRequestGitHubData,
          onStoreGet,
          onStoreSet,
          onNavigateToPath,
          onRequestBlocksRepos,
        }}
      />
    );
  }

  return (
    <div className="sandbox-wrapper h-full w-full">
      <SandboxedBlock
        {...{
          block,
          contents,
          originalContent,
          isEditable,
          tree,
          context: fileContext,
          metadata,
          onUpdateMetadata,
          onUpdateContent,
          onRequestGitHubData,
          onStoreGet,
          onStoreSet,
          onNavigateToPath,
        }}
      />
    </div>
  );
});
