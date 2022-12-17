import { useContext, useEffect, useMemo } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import pm from "picomatch";
import type { RepoFiles } from "@githubnext/blocks";
import { AppContext } from "context";
import type { Context } from "./index";
import { getBlockKey, useManageBlock } from "hooks";
import BlockPaneHeader from "./BlockPaneHeader";

const { publicRuntimeConfig } = getConfig();

type BlockPaneProps = {
  fileInfo: RepoFiles[0];
  path: string;
  metadata: any;
  setRequestedBlockMetadata: (metadata: any) => void;
  context: Context;
  branchName: string;
  onSaveChanges: () => void;
};

export default function BlockPane({
  fileInfo,
  path,
  metadata,
  setRequestedBlockMetadata,
  context,
  onSaveChanges,
}: BlockPaneProps) {
  const router = useRouter();
  const { devServerInfo } = useContext(AppContext);

  const isFolder = fileInfo.type !== "blob";

  const metadataForPath = useMemo(() => {
    if (metadata[path]) return metadata[path];
    const globs = Object.keys(metadata).filter((key) => {
      const globs = key.split(",").map((glob) => glob.trim());
      if (!path && globs.includes("")) return true;
      const doesMatch = pm(
        globs.filter((g) => g !== ""),
        { bash: true, dot: true }
      )(path);
      return doesMatch;
    });
    return metadata[globs[0]] || {};
  }, [metadata, path]);

  const manageBlockResult = useManageBlock({
    path,
    storedDefaultBlock: metadataForPath.default,
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

  const srcBase = devServerInfo?.devServer ?? publicRuntimeConfig.sandboxDomain;
  const src = `${srcBase}#${encodeURIComponent(
    JSON.stringify({ block, context })
  )}`;

  return (
    <>
      <BlockPaneHeader
        {...{
          manageBlockResult,
          path,
          isFolder,
          metadata,
          setRequestedMetadata: setRequestedBlockMetadata,
          context,
          onSaveChanges,
        }}
      />
      {block && (
        <div className="overflow-y-auto w-full flex-1">
          <iframe
            key={block.id}
            className={"w-full h-full"}
            allow="camera;microphone;xr-spatial-tracking"
            sandbox={[
              "allow-scripts",
              "allow-same-origin",
              "allow-forms",
              // so blocks can open links
              "allow-top-navigation-by-user-activation",
              // so blocks can open links in new windows
              "allow-popups",
            ].join(" ")}
            src={src}
          />
        </div>
      )}
    </>
  );
}
