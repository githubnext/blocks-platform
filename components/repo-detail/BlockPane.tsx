import { useContext, useEffect, useMemo, useState } from "react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import pm from "picomatch";
import type { Block, RepoFiles } from "@githubnext/blocks";
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

  let isAllowedBlock = true;

  if (appContext.isPrivate) {
    isAllowedBlock =
      !!block && isBlockOnAllowList(appContext.blocksConfig.allow, block);
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
          block={block}
          blockKey={blockKey}
          context={context}
          isBranchable={isBranchable}
          branchName={branchName}
          blocksConfig={appContext.blocksConfig}
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
  block,
  blockKey,
  context,
  blocksConfig,
  isBranchable,
  branchName,
}: {
  block: Block;
  blockKey: string;
  context: Context;
  blocksConfig: BlocksConfig;
  isBranchable: boolean;
  branchName: string;
}) => {
  const [proposedBlock, setProposedBlock] = useState<AllowBlock | null>(null);
  const queryClient = useQueryClient();

  return (
    <div className="overflow-y-auto w-full flex-1 pb-10 flex items-center justify-center">
      <div className="max-w-3xl p-10">
        <Flash variant="danger" sx={{ mb: 4 }}>
          <p className="text-red-700">
            <StyledOcticon icon={AlertFillIcon} />
            This block is not allowed to be used in this repository.
          </p>
        </Flash>
        <p>
          To protect against malicious code, blocks need to be explicitly
          allowed in private repositories. If you trust this block, you can add
          it to the allowlist in{" "}
          <code className="text-sm">.github/blocks/config.json</code>.
        </p>
        <div className="flex mt-6 space-x-2">
          <Button
            onClick={() =>
              setProposedBlock({
                owner: block.owner,
                repo: block.repo,
                id: block.id,
              })
            }
            variant="primary"
            className="!font-normal"
            size="large"
          >
            Add <span className="font-semibold">{block.title}</span> to
            allowlist
          </Button>
          <Button
            onClick={() =>
              setProposedBlock({
                owner: block.owner,
                repo: block.repo,
                id: "*",
              })
            }
            variant="default"
            className="!font-normal"
            size="large"
          >
            Add{" "}
            <span className="font-semibold">
              all blocks in {block.owner}/{block.repo}
            </span>{" "}
            to allowlist
          </Button>
        </div>
      </div>
      {!!proposedBlock && (
        <CommitCodeDialog
          repo={context.repo}
          owner={context.owner}
          path=".github/blocks/config.json"
          newCode={JSON.stringify(
            {
              ...blocksConfig,
              allow: [...(blocksConfig.allow || []), proposedBlock],
            },
            null,
            2
          )}
          currentCode={JSON.stringify(blocksConfig, null, 2)}
          onCommit={() => {
            setProposedBlock(null);
            queryClient.invalidateQueries(
              QueryKeyMap.file.factory({
                owner: context.owner,
                repo: context.repo,
                path: ".github/blocks/config.json",
                fileRef: branchName,
              })
            );
          }}
          onCancel={() => {
            setProposedBlock(null);
          }}
          isOpen
          branchName={branchName}
          branchingDisabled={!isBranchable}
        />
      )}
    </div>
  );
};

const isBlockOnAllowList = (allowList: AllowBlock[], block: Block) => {
  if (!allowList) return false;
  // always allow example blocks
  if (block.owner === "githubnext" && block.repo === "blocks-examples")
    return true;
  return allowList.some((allowBlock) => {
    return doesAllowBlockMatch(allowBlock, block);
  });
};

const doesAllowBlockMatch = (allowBlock: AllowBlock, block: Block) => {
  return ["owner", "repo", "id"].every((key) => {
    if (!allowBlock[key]) return false;
    return pm([allowBlock[key]], { bash: true, dot: true })(block[key]);
  });
};
