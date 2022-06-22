import React from "react";
import type { Block } from "@githubnext/blocks";
import type { Context } from "./index";
import { useMetadata } from "hooks";
import { useRouter } from "next/router";
import { ErrorBoundary } from "../error-boundary";
import { UpdateCodeModal } from "../UpdateCodeModal";

type BlockPaneBlockProps = {
  token: string;
  block: Block;
  context: Context;
  branchName: string;
};

export default function BlockPaneBlock({
  token,
  block,
  context,
  branchName,
}: BlockPaneBlockProps) {
  /*
  if (isTooLarge)
    return (
      <div className="italic p-4 pt-40 text-center mx-auto text-gray-600">
        Oh boy, that's a honkin file! It's {size / 1000} KBs.
      </div>
    );
  */

  const { repo, owner, path, sha } = context;

  const [requestedMetadata, setRequestedMetadata] = React.useState(null);
  const [requestedMetadataExisting, setRequestedMetadataExisting] =
    React.useState(null);
  const [requestedMetadataPath, setRequestedMetadataPath] =
    React.useState(null);
  const [requestedMetadataPathFull, setRequestedMetadataPathFull] =
    React.useState(null);

  const router = useRouter();

  const blockKey = getBlockKey(block);
  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: block.entry && getMetadataPath(block, path),
    filePath: path,
    token: token,
    branchName,
  });
  const type = block.type;

  return (
    <div
      className="flex flex-col"
      style={{
        height: "calc(100% - 3.3em)",
      }}
    >
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <iframe
            key={block.id}
            className={"w-full h-full"}
            sandbox={"allow-scripts allow-same-origin"}
            src={`${
              process.env.NEXT_PUBLIC_SANDBOX_DOMAIN
            }#${encodeURIComponent(JSON.stringify({ block, context }))}`}
          />
        </div>
      </ErrorBoundary>
      {!!requestedMetadata && (
        <UpdateCodeModal
          isLoggedIn={!!token}
          path={`.github/blocks/${type}/${blockKey}.json`}
          newCode={JSON.stringify(requestedMetadata, null, 2)}
          currentCode={
            requestedMetadataExisting || JSON.stringify(metadata, null, 2)
          }
          onSubmit={() => {
            onUpdateMetadata(
              requestedMetadata,
              requestedMetadataPathFull || ""
            );
            setTimeout(() => {
              window.postMessage({
                type: "updated-metadata",
                path: requestedMetadataPath,
              });
            }, 1000);
          }}
          onClose={() => setRequestedMetadata(null)}
        />
      )}
    </div>
  );
}

export const getBlockKey = (block) =>
  `${block?.owner}/${block?.repo}__${block?.id}`.replace(/\//g, "__");
export const getMetadataPath = (block, path) =>
  `.github/blocks/${block?.type}/${getBlockKey(block)}/${encodeURIComponent(
    path
  )}.json`;
