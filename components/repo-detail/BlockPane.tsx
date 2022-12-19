import { useContext, useEffect, useMemo, useState } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import pm from "picomatch";
import type { RepoFiles } from "@githubnext/blocks";
import { AppContext } from "context";
import type { Context } from "./index";
import { getBlockKey, useManageBlock } from "hooks";
import BlockPaneHeader from "./BlockPaneHeader";
import { Button, Flash, StyledOcticon } from "@primer/react";
import { AlertFillIcon } from "@primer/octicons-react";
import { CommitCodeDialog } from "./../commit-code-dialog";
import { useQueryClient } from "react-query";
import { QueryKeyMap } from "lib/query-keys";

const { publicRuntimeConfig } = getConfig();

type BlockPaneProps = {
  fileInfo: RepoFiles[0];
  path: string;
  metadata: any;
  setRequestedBlockMetadata: (metadata: any) => void;
  context: Context;
  branchName: string;
  isBranchable: boolean;
  onSaveChanges: () => void;
};

export default function BlockPane({
  fileInfo,
  path,
  metadata,
  setRequestedBlockMetadata,
  context,
  branchName,
  isBranchable,
  onSaveChanges,
}: BlockPaneProps) {
  const router = useRouter();
  const appContext = useContext(AppContext);
  const { devServerInfo } = useContext(AppContext);
  const blockKey = router.query.blockKey as string;
  const [hasOverriddenAllowList, setHasOverriddenAllowList] = useState(false);

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

  useEffect(() => {
    setHasOverriddenAllowList(false);
  }, [blockKey, path]);

  let isAllowedBlock = true;

  if (appContext.isPrivate) {
    isAllowedBlock =
      hasOverriddenAllowList ||
      appContext.blocksConfig.allow.includes(blockKey) ||
      (manageBlockResult.status === "success" &&
        block.owner === "githubnext" &&
        block.repo === "blocks-examples");
  }

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
      {manageBlockResult.status !== "success" ? (
        <div className=""></div>
      ) : !isAllowedBlock ? (
        <NotAllowedWarning
          blockKey={blockKey}
          context={context}
          isBranchable={isBranchable}
          branchName={branchName}
          blocksConfig={appContext.blocksConfig}
          onOverrideAllowList={() => setHasOverriddenAllowList(true)}
        />
      ) : block ? (
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
      ) : null}
    </>
  );
}

const NotAllowedWarning = ({
  blockKey,
  context,
  blocksConfig,
  isBranchable,
  branchName,
  onOverrideAllowList,
}: {
  blockKey: string;
  context: Context;
  blocksConfig: BlocksConfig;
  isBranchable: boolean;
  branchName: string;
  onOverrideAllowList: () => void;
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const allowList = blocksConfig.allow;
  const queryClient = useQueryClient();

  return (
    <div className="overflow-y-auto w-full flex-1 pb-10 flex items-center justify-center">
      <div className="max-w-4xl p-10">
        <Flash variant="danger" sx={{ mb: 3 }}>
          <p className="text-red-700">
            <StyledOcticon icon={AlertFillIcon} />
            This block is not allowed to be used in this repository.
          </p>
        </Flash>
        {allowList?.length ? (
          <>
            <p>The following blocks are allowed:</p>
            <ul className="text-red-700 list-disc pl-8 mt-2">
              {allowList.map((blockKey) => (
                <li key={blockKey}>
                  <span className="font-mono text-sm">{blockKey}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>
            To use specific blocks in this repo, add them to the allowlist in{" "}
            <code className="text-sm">.github/blocks/config.json</code>.
          </p>
        )}
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsAdding(true)}
            variant="primary"
            className="mt-4"
          >
            Add to allowlist
          </Button>
          <Button
            onClick={onOverrideAllowList}
            variant="default"
            className="mt-4"
          >
            Use anyway{" "}
            <span className="font-normal">(this might not be secure)</span>
          </Button>
        </div>
      </div>
      {isAdding && (
        <CommitCodeDialog
          repo={context.repo}
          owner={context.owner}
          path=".github/blocks/config.json"
          newCode={JSON.stringify(
            {
              ...blocksConfig,
              allow: [...blocksConfig.allow, blockKey],
            },
            null,
            2
          )}
          currentCode={JSON.stringify(blocksConfig, null, 2)}
          onCommit={() => {
            setIsAdding(false);
            // invalidate repo info
            queryClient.invalidateQueries(
              QueryKeyMap.info.factory({
                owner: context.owner,
                repo: context.repo,
              })
            );
          }}
          onCancel={() => {
            setIsAdding(false);
          }}
          isOpen
          branchName={branchName}
          branchingDisabled={!isBranchable}
        />
      )}
    </div>
  );
};
