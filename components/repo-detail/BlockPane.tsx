import { useContext, useEffect } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import type { RepoFiles } from "@githubnext/blocks";
import { AppContext } from "context";
import type { Context } from "./index";
import { getBlockKey, useManageBlock } from "hooks";
import BlockPaneHeader from "./BlockPaneHeader";

const { publicRuntimeConfig } = getConfig();

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
  const { devServerInfo } = useContext(AppContext);

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

  let srcBase = publicRuntimeConfig.sandboxDomain;
  if (
    devServerInfo &&
    block &&
    devServerInfo.owner === block.owner &&
    devServerInfo.repo === block.repo
  ) {
    srcBase = devServerInfo.devServer;
  }
  const src = `${srcBase}#${encodeURIComponent(
    JSON.stringify({ block, context })
  )}`;

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
            src={src}
          />
        </div>
      )}
    </>
  );
}
