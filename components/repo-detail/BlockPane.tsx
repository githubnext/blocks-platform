import { useEffect } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import type { RepoFiles } from "@githubnext/blocks";
import type { Context } from "./index";
import { getBlockKey, useManageBlock } from "hooks";
import { getOwnerRepoFromDevServer } from "ghapi";
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
  const { devServer } = router.query as Record<string, string>;

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

  const { data: devServerOwnerRepo, status: devServerOwnerRepoStatus } =
    useQuery("devServerOwnerRepo", () => getOwnerRepoFromDevServer(devServer), {
      enabled: !!devServer,
    });

  const src = `${
    devServerOwnerRepoStatus === "success" &&
    devServerOwnerRepo.owner === block?.owner &&
    devServerOwnerRepo.repo === block?.repo
      ? router.query.devServer
      : publicRuntimeConfig.sandboxDomain
  }#${encodeURIComponent(JSON.stringify({ block, context }))}`;

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
      {block && devServerOwnerRepoStatus !== "loading" && (
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
