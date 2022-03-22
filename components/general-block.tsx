import {
  FileContext,
  FolderContext,
  onRequestGitHubData,
} from "@githubnext/utils";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
import {
  useFileContent,
  useFolderContent,
  useMetadata,
  useRepoTimeline,
} from "hooks";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import { CommitCodeDialog } from "./commit-code-dialog";
import { ErrorBoundary } from "./error-boundary";
import { UpdateCodeModal } from "./UpdateCodeModal";

interface GeneralBlockProps {
  theme: string;
  context: FileContext | FolderContext;
  block: Block;
  token: string;
  branchName: string;
}

export function GeneralBlock(props: GeneralBlockProps) {
  const { context, theme, block, token, branchName } = props;
  const { repo, owner, path, sha } = context;

  const [requestedMetadata, setRequestedMetadata] = React.useState(null);
  const [requestedMetadataExisting, setRequestedMetadataExisting] =
    React.useState(null);
  const [requestedMetadataPath, setRequestedMetadataPath] =
    React.useState(null);
  const [requestedMetadataPathFull, setRequestedMetadataPathFull] =
    React.useState(null);
  const [requestedFileContent, setRequestedFileContent] = React.useState(null);

  const router = useRouter();
  const query = router.query;

  const blockKey = getBlockKey(block);
  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: block.entry && getMetadataPath(block, path),
    filePath: path,
    token: token,
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

  const onRequestUpdateContent = async (newContent: string) => {
    setRequestedFileContent(newContent);
  };

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

  const { data: fileData } = useFileContent(
    {
      repo: repo,
      owner: owner,
      path: path,
      fileRef: sha,
    },
    {
      enabled: type === "file",
      cacheTime: 0,
    }
  );
  const { content = "" } = fileData || {};

  const code = content;

  const name = path.split("/").pop();

  const updatedContext = useMemo(
    () =>
      ({
        ...context,
        [type]: name,
      } as FileContext | FolderContext),
    [context, name, type]
  );

  const { data: timelineData } = useRepoTimeline({
    repo,
    owner,
    path,
  });

  let mostRecentCommit =
    timelineData?.commits?.length > 0 ? timelineData.commits[0].sha : null;
  let isBranchable = sha === mostRecentCommit || sha === branchName;

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
            contents={code}
            metadata={metadata}
            onUpdateMetadata={onRequestUpdateMetadata}
            onRequestUpdateContent={onRequestUpdateContent}
            onRequestGitHubData={onRequestGitHubData}
            onNavigateToPath={onNavigateToPath}
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
      {!!requestedFileContent && (
        <CommitCodeDialog
          repo={repo}
          owner={owner}
          path={path}
          newCode={requestedFileContent}
          currentCode={content}
          onClose={() => setRequestedFileContent(null)}
          isOpen
          token={token}
          branchingDisabled={!isBranchable}
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
