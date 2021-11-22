import { FileContext, FolderContext } from "@githubnext/utils";
import { RepoFiles } from "ghapi";
import { SandboxedBlock } from "./sandboxed-block";

interface SandboxedBlockWrapperProps {
  block: Block;
  contents?: string;
  theme: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  metadata: any;
}

export function SandboxedBlockWrapper(props: SandboxedBlockWrapperProps) {
  const {
    block,
    metadata,
    contents,
    theme,
    tree,
    context,
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
