import {
  FileContext,
  FolderContext,
  onRequestGitHubData as utilsOnRequestGitHubData,
} from "@githubnext/utils";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
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
  const queryClient = useQueryClient();

  const [requestedMetadata, setRequestedMetadata] = React.useState(null);
  const [requestedMetadataExisting, setRequestedMetadataExisting] =
    React.useState(null);
  const [requestedMetadataPath, setRequestedMetadataPath] =
    React.useState(null);
  const [requestedMetadataPathFull, setRequestedMetadataPathFull] =
    React.useState(null);

  const router = useRouter();
  const query = router.query;

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

  const onRequestUpdateMetadata = async (
    newMetadata: any,
    pathToUpdate = path,
    blockToUpdate = block,
    currentMetadata = metadata
  ) => {
    setRequestedMetadata(newMetadata);
    setRequestedMetadataExisting(
      JSON.stringify(currentMetadata || "{}", null, 2)
    );
    setRequestedMetadataPath(pathToUpdate);
    setRequestedMetadataPathFull(getMetadataPath(blockToUpdate, pathToUpdate));
  };
  const onNavigateToPath = (path: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...query, path: path },
      },
      null,
      { shallow: true }
    );
  };

  const onRequestGitHubData = (path: string, params?: Record<string, any>) =>
    utilsOnRequestGitHubData(path, params, token);

  const onRequestBlocksRepos = () =>
    queryClient.fetchQuery(
      QueryKeyMap.blocksRepos.factory({}),
      getAllBlocksRepos
    );

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
          <SandboxedBlockWrapper
            block={block}
            theme={theme}
            context={updatedContext}
            tree={tree}
            contents={content}
            originalContent={originalContent}
            isEditable={isEditable}
            metadata={metadata}
            onUpdateMetadata={onRequestUpdateMetadata}
            onUpdateContent={onUpdateContent}
            onRequestGitHubData={onRequestGitHubData}
            onNavigateToPath={onNavigateToPath}
            onRequestBlocksRepos={onRequestBlocksRepos}
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
