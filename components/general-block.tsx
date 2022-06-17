import { Block, FileContext, FolderContext } from "@githubnext/blocks";
import IFramedBlock from "components/iframed-block";
import { useFolderContent, useMetadata } from "hooks";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { useQueryClient } from "react-query";
import { QueryKeyMap } from "lib/query-keys";
import { getAllBlocksRepos } from "ghapi";
import { ErrorBoundary } from "./error-boundary";
import { UpdateCodeModal } from "./UpdateCodeModal";

interface GeneralBlockProps {
  theme: string;
  context: FileContext | FolderContext;
  block: Block;
  token: string;
  branchName: string;
  content: string;
  originalContent: string;
  isEditable: boolean;
  onUpdateContent: (newContent: string) => void;
}

export function GeneralBlock(props: GeneralBlockProps) {
  const {
    context,
    theme,
    block,
    token,
    branchName,
    content,
    originalContent,
    isEditable,
    onUpdateContent,
  } = props;
  const { repo, owner, path, sha } = context;

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: block.entry && getMetadataPath(block, path),
    filePath: path,
    token: token,
    branchName,
  });
  const type = block.type;

  const { data: treeData } = useFolderContent(
    {
      repo: repo,
      owner: owner,
      path: path,
      fileRef: sha,
    },
    {
      enabled: type === "folder",
    }
  );

  const tree = useMemo(() => treeData?.tree || [], [treeData]);

  const name = path.split("/").pop();

  const updatedContext = useMemo(
    () =>
      ({
        ...context,
        [type]: name,
      } as FileContext | FolderContext),
    [context, name, type]
  );

  return (
    <div
      className="flex flex-col"
      style={{
        height: "calc(100% - 3.3em)",
      }}
    >
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <IFramedBlock
            {...{
              block,
              context: updatedContext,
              tree,
              contents: content,
              originalContent,
              isEditable,
              metadata,
            }}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}

export const getBlockKey = (block) =>
  `${block?.owner}/${block?.repo}__${block?.id}`.replace(/\//g, "__");
export const getMetadataPath = (block, path) =>
  `.github/blocks/${block?.type}/${getBlockKey(block)}/${encodeURIComponent(
    path
  )}.json`;
