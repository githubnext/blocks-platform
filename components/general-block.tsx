import {
  Block,
  FileContext,
  FolderContext,
  onRequestGitHubData as utilsOnRequestGitHubData,
} from "@githubnext/blocks";
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

  const makeStoreURL = (key: string) =>
    `/api/store/${block.repoId}/${
      block.id
    }/${owner}/${repo}/${encodeURIComponent(key)}`;

  const onStoreGet = async (key: string): Promise<any> => {
    const res = await fetch(makeStoreURL(key));
    if (res.status === 404) return undefined;
    else return await res.json();
  };

  const onStoreSet = async (key: string, value: string): Promise<void> => {
    return (
      value === undefined
        ? fetch(makeStoreURL(key), {
            method: "DELETE",
          })
        : fetch(makeStoreURL(key), {
            method: "PUT",
            body: JSON.stringify(value),
          })
    ).then((_) => undefined);
  };

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
              onUpdateMetadata: onRequestUpdateMetadata,
              onUpdateContent,
              onRequestGitHubData,
              onNavigateToPath,
              onStoreGet,
              onStoreSet,
              onRequestBlocksRepos,
            }}
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
