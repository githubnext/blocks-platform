import { FileContext, FolderContext } from "@githubnext/utils";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
import { getFileContent, getGenericData, getRepoInfo } from "ghapi";
import {
  useFileContent,
  useFolderContent,
  useMetadata,
  useUpdateFileContents,
} from "hooks";
import { useRouter } from "next/router";
import React, { useEffect, useMemo } from "react";
import { useQueryClient } from "react-query";
import { ErrorBoundary } from "./error-boundary";
import { UpdateCodeModal } from "./UpdateCodeModal";

interface GeneralBlockProps {
  theme: string;
  context: FileContext | FolderContext;
  block: Block;
  token: string;
}

export function GeneralBlock(props: GeneralBlockProps) {
  const { context, theme, block, token } = props;
  const queryClient = useQueryClient();
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

  const getGitHubData = async (
    path: string,
    params: Record<string, any> = {}
  ) => {
    // handle paths that accidentally include the domain
    const parsedPath = path.replace("https://api.github.com", "");
    const data = await getGenericData(
      parsedPath,
      {
        ...params,
        // restrict to GET calls to prevent updating data
        method: "GET",
      },
      token
    );
    return data;
  };

  const { mutateAsync } = useUpdateFileContents({
    onSuccess: async () => {
      await queryClient.invalidateQueries("file");
      await queryClient.invalidateQueries("timeline");
      console.info("✅ Refreshed timeline and file");
    },
  });
  const onUpdateContent = async (newContent: string) => {
    await mutateAsync({
      content: newContent,
      owner,
      repo,
      path,
      sha: "latest",
      token: token as string,
    });
  };

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

  const onRequestGitHubData = async (
    path,
    params: Record<string, any> = {},
    id = ""
  ) => {
    const data = await getGitHubData(path, params);
    window.postMessage(
      {
        type: "github-data--response",
        id,
        data,
      },
      "*"
    );
    return data;
  };

  const { data: treeData } = useFolderContent(
    type === "folder" && {
      repo: repo,
      owner: owner,
      path: path,
      fileRef: sha,
      token: token as string,
    }
  );
  const tree = useMemo(() => treeData?.tree || [], [treeData]);

  const { data: fileData } = useFileContent(
    type === "file" && {
      repo: repo,
      owner: owner,
      path: path,
      fileRef: sha,
      token: token as string,
    },
    {
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
        <UpdateCodeModal
          isLoggedIn={!!token}
          path={path}
          newCode={requestedFileContent}
          currentCode={content}
          onSubmit={() => onUpdateContent(requestedFileContent)}
          onClose={() => setRequestedFileContent(null)}
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

const fetchGitHubData = async (type, config) => {
  if (type === "file-content") {
    const data = await getFileContent({
      owner: config.owner,
      repo: config.repo,
      path: config.path,
      fileRef: config.fileRef || "HEAD",
      token: config.token,
    });
    return data;
  } else if (type === "metadata") {
    try {
      const res = await getFileContent({
        owner: config.owner,
        repo: config.repo,
        path: getMetadataPath(config.block, config.path),
        fileRef: "HEAD",
        cache: new Date().toString(),
        token: config.token,
      });
      const fullMetadata = JSON.parse((res.content || "{}") as string);
      return fullMetadata || {};
    } catch (e) {
      return {};
    }
  } else if (type === "repo-info") {
    try {
      const res = await getRepoInfo({
        owner: config.owner,
        repo: config.repo,
        token: config.token,
      });
      return res;
    } catch (e) {
      return {};
    }
  }
};
