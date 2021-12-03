import { FileContext, FolderContext } from "@githubnext/utils";
import { RepoFiles } from "ghapi";
import { SandboxedBlock } from "components/sandboxed-block"
import { ExampleBlock } from "components/example-block"

interface SandboxedBlockWrapperProps {
  block: Block;
  contents?: string;
  theme: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  metadata: any;
  isEmbedded?: boolean;
}

const exampleBlocksRepo = "githubnext/blocks-examples";
export function SandboxedBlockWrapper(props: SandboxedBlockWrapperProps) {
  const {
    block,
    metadata,
    contents,
    theme,
    tree,
    context,
    isEmbedded = false,
  } = props;

  const fileContext = {
    ...context,
    theme,
  } as any;

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
      />
    )
  }

  return (
    <div className="sandbox-wrapper h-full w-full">
      <SandboxedBlock
        block={block}
        contents={contents}
        tree={tree}
        context={fileContext}
        metadata={metadata}
      />
    </div>
  );
}
