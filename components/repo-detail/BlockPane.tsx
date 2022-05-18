import { useEffect } from "react";
import { useRouter } from "next/router";
import type { RepoFiles } from "@githubnext/blocks";
import type { Context, UpdatedContents } from "./index";
import { getBlockKey, useManageBlock } from "hooks";
import BlockPaneHeader from "./BlockPaneHeader";
import BlockPaneBlock from "./BlockPaneBlock";

type BlockPaneProps = {
  fileInfo: RepoFiles[0];
  path: string;
  token: string;
  metadata: any;
  setRequestedMetadata: (metadata: any) => void;
  isFullscreen: boolean;
  context: Context;
  theme: string;
  branchName: string;
  updatedContents: UpdatedContents;
  setUpdatedContents: (_: UpdatedContents) => void;
  onSaveChanges: () => void;
};

export default function BlockPane({
  fileInfo,
  path,
  token,
  metadata,
  setRequestedMetadata,
  isFullscreen,
  context,
  theme,
  branchName,
  updatedContents,
  setUpdatedContents,
  onSaveChanges,
}: BlockPaneProps) {
  const router = useRouter();

  const isFolder = fileInfo.type !== "blob";

  const manageBlockResult = useManageBlock({
    path,
    storedDefaultBlock: metadata[path]?.default,
    isFolder,
  });

  const block = manageBlockResult.data?.block;

  useEffect(() => {
    if (block) {
      const blockKey = getBlockKey(block);
      if (router.query.blockKey !== blockKey) {
        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...router.query,
              blockKey: blockKey,
            },
          },
          undefined,
          { shallow: true }
        );
      }
    }
  });

  return (
    <>
      <BlockPaneHeader
        {...{
          manageBlockResult,
          isFullscreen,
          path,
          isFolder,
          token,
          metadata,
          setRequestedMetadata,
          context,
          onSaveChanges,
        }}
      />
      {block && (
        <BlockPaneBlock
          {...{
            token,
            block,
            fileInfo,
            path,
            context,
            isFolder,
            theme,
            branchName,
            updatedContents,
            setUpdatedContents,
          }}
        />
      )}
    </>
  );
}
