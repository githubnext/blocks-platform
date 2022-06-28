import { useEffect } from "react";
import { useRouter } from "next/router";
import type { RepoFiles } from "@githubnext/blocks";
import type { Context } from "./index";
import { getBlockKey, useManageBlock } from "hooks";
import BlockPaneHeader from "./BlockPaneHeader";

type BlockPaneProps = {
  fileInfo: RepoFiles[0];
  path: string;
  token: string;
  metadata: any;
  setRequestedBlockMetadata: (metadata: any) => void;
  isFullscreen: boolean;
  context: Context;
  branchName: string;
  onSaveChanges: () => void;
};

export default function BlockPane({
  fileInfo,
  path,
  token,
  metadata,
  setRequestedBlockMetadata,
  isFullscreen,
  context,
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
          setRequestedMetadata: setRequestedBlockMetadata,
          context,
          onSaveChanges,
        }}
      />
      {block && (
        <div className="overflow-y-auto w-full h-full">
          <iframe
            key={block.id}
            className={"w-full h-full"}
            sandbox={"allow-scripts allow-same-origin allow-forms"}
            src={`${
              process.env.NEXT_PUBLIC_SANDBOX_DOMAIN
            }#${encodeURIComponent(JSON.stringify({ block, context }))}`}
          />
        </div>
      )}
    </>
  );
}
