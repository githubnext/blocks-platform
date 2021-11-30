import { RepoContext, RepoFiles } from "ghapi";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
import { useFolderContent, useMetadata } from "hooks";
import React, { useMemo } from "react";
import { ErrorBoundary } from "./error-boundary";
import { FolderContext } from "@githubnext/utils";

interface FolderBlockProps {
  allFiles: RepoFiles;
  theme: string;
  context: FolderContext;
  block: Block;
  session: Session;
}

export function FolderBlock(props: FolderBlockProps) {
  const {
    context,
    theme,
    block,
    allFiles,
    session,
  } = props;
  const { repo, owner, path, sha } = context;

  const blockKey =
    `${block.owner}/${block.repo}__${block.id}`.replace(
      /\//g,
      "__"
    );
  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: block.entry && `.github/blocks/folder/${blockKey}`,
    filePath: path,
    token: session?.token as string,
  });

  const { data } = useFolderContent({
    repo: repo,
    owner: owner,
    path: path,
    fileRef: sha,
    token: session?.token as string,
  });
  const { tree = [] } = data || {};

  const name = path.split("/").pop();

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <SandboxedBlockWrapper
            block={block}
            theme={theme}
            context={{ ...context, folder: name }}
            tree={tree}
            metadata={metadata}
            // @ts-ignore
            onUpdateMetadata={onUpdateMetadata}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
