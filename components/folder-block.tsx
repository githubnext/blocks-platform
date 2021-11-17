import { RepoContext, RepoFiles } from "ghapi";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
import { useMetadata } from "hooks";
import React, { useMemo } from "react";
import { ErrorBoundary } from "./error-boundary";
import { FolderContext } from "@githubnext/utils";

interface FolderBlockProps {
  allFiles: RepoFiles;
  theme: string;
  blockContext: RepoContext;
  context: FolderContext;
  dependencies: Record<string, string>;
  block: Block;
  session: Session;
}

export function FolderBlock(props: FolderBlockProps) {
  const {
    context,
    theme,
    block,
    dependencies,
    allFiles,
    session,
    blockContext,
  } = props;
  const { repo, owner, path, sha } = context;

  const blockId =
    `${blockContext.owner}/${blockContext.repo}__${block.entry}`.replace(
      /\//g,
      "__"
    );
  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: block.entry && `.github/blocks/folder/${blockId}`,
    filePath: path,
    token: session.token as string,
  });

  const data = useMemo(
    () => allFiles?.filter((d) => d.path.startsWith(path)),
    [allFiles, path]
  );

  const name = path.split("/").pop();

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <SandboxedBlockWrapper
            block={block}
            theme={theme}
            context={{ ...context, folder: name }}
            blockContext={blockContext}
            dependencies={dependencies}
            tree={data}
            metadata={metadata}
            session={session}
            // @ts-ignore
            onUpdateMetadata={onUpdateMetadata}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
