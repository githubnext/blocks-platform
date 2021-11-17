import { getFileContent, RepoContext, RepoFiles } from "ghapi";
import { useCallback, useMemo } from "react";
import { FileContext, FolderContext } from "@githubnext/utils";
import { SandboxedBlock } from "@githubnext/utils";

interface SandboxedBlockWrapperProps {
  block: Block;
  blockContext: RepoContext;
  contents?: string;
  theme: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  dependencies: Record<string, string>;
  metadata: any;
  session: Session;
}

export function SandboxedBlockWrapper(props: SandboxedBlockWrapperProps) {
  const {
    block,
    blockContext,
    metadata,
    contents,
    theme,
    tree,
    dependencies,
    context,
    session,
  } = props;

  const getFileContentForPath = useCallback(
    async (path: string) => {
      const res = await getFileContent({
        repo: blockContext.repo,
        owner: blockContext.owner,
        fileRef: "main",
        token: "",
        path,
      });
      return res.content;
    },
    [context.repo, context.owner, context.sha, session.token]
  );

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
        getFileContent={getFileContentForPath}
        contents={contents}
        tree={tree}
        context={fileContext}
        dependencies={dependencies}
        block={block}
        metadata={metadata}
        session={session}
      />
    </div>
  );
}
