import { useContext, useEffect, useRef } from "react";
import { useQueryClient, QueryClient } from "react-query";
import { useRouter } from "next/router";
import type { Block, RepoFiles } from "@githubnext/blocks";
import { onRequestGitHubData } from "@githubnext/blocks";
import { QueryKeyMap } from "lib/query-keys";
import {
  getAllBlocksRepos,
  getFileContent,
  getFolderContent,
  getMetadata,
} from "ghapi";
import { getBlockKey } from "hooks";
import type { AppContextValue } from "context";
import { AppContext } from "context";
import { Context, UpdatedContents } from "./index";

const setBundle = async (window: Window, block: Block) => {
  const url = `/api/get-block-content?owner=${block.owner}&repo=${block.repo}&id=${block.id}`;
  const res = await fetch(url);
  if (res.ok) {
    const bundle = await res.json();
    window.postMessage(
      { type: "set-bundle", bundle: bundle.content },
      // TODO(jaked) origin should be blocks-sandbox
      "*"
    );
  } else {
    console.error(res);
  }
};

const makeSetProps =
  ({
    queryClient,
    appContext,
    owner,
    repo,
    branchName,
    files,
    updatedContents,
  }: {
    queryClient: QueryClient;
    appContext: AppContextValue;
    owner: string;
    repo: string;
    branchName: string;
    files: RepoFiles;
    updatedContents: UpdatedContents;
  }) =>
  (window: Window, block: Block, context: Context) => {
    const path = context.path;

    // TODO(jaked) handle requests for other repos
    // this is complicated because we rely on `files` for the current repo
    if (context.owner !== owner || context.repo !== repo) return;

    // fetch metadata for the block and path
    const metadataPath = getMetadataPath(block, path);
    const metadata = queryClient.fetchQuery(
      QueryKeyMap.file.factory({
        owner: context.owner,
        repo: context.repo,
        path: metadataPath,
        // TODO(jaked) branchName doesn't make sense for a file in another repo
        // maybe metadata should always be on main?
        fileRef: branchName,
      }),
      getMetadata,
      {
        retry: false,
        staleTime: 5 * 60 * 1000,
      }
    );

    const fileInfo =
      path === ""
        ? { type: "tree" } // the root path is not included in `files`
        : files && files.find((d) => d.path === path);
    const isFolder = fileInfo.type !== "blob";

    // fetch content for the path
    if (isFolder) {
      const treeData = queryClient.fetchQuery(
        QueryKeyMap.folder.factory(context),
        getFolderContent,
        {
          retry: false,
        }
      );
      Promise.all([metadata, treeData]).then(([metadata, treeData]) => {
        window.postMessage(
          {
            type: "set-props",
            props: {
              block,
              context, // TODO(jaked) add file / folder name
              metadata,
              tree: treeData.tree,
            },
          },
          "*"
        ); // TODO(jaked) origin should be blocks-sandbox
      });
    } else {
      const size = fileInfo.size || 0;
      const fileSizeLimit = 1500000; // 1.5Mb
      // TODO(jaked) handle too-largeness
      const isTooLarge = size > fileSizeLimit;

      const fileData = queryClient.fetchQuery(
        QueryKeyMap.file.factory({
          owner: context.owner,
          repo: context.repo,
          path: context.path,
          fileRef: context.sha,
        }),
        getFileContent,
        {
          retry: false,
          // TODO(jaked)
          // existing code has cacheTime: 0 to force a refresh on commit.
          // would be better to handle this by invalidating the query.
        }
      );

      Promise.all([metadata, fileData]).then(([metadata, fileData]) => {
        const onBranchTip = context.sha === branchName;
        const showUpdatedContents = onBranchTip && updatedContents[path];

        let content: string;
        let originalContent: string;
        if (showUpdatedContents) {
          content = updatedContents[path].content;
          originalContent = updatedContents[path].original;
        } else {
          content = fileData.content;
          originalContent = content;
        }
        const isEditable =
          onBranchTip &&
          appContext.hasRepoInstallation &&
          appContext.permissions.push;

        window.postMessage(
          {
            type: "set-props",
            props: {
              block,
              context, // TODO(jaked) add file / folder name
              metadata,
              content,
              originalContent,
              isEditable,
            },
          },
          "*"
        ); // TODO(jaked) origin should be blocks-sandbox
      });
    }
  };

const getMetadataPath = (block, path) =>
  `.github/blocks/${block?.type}/${getBlockKey(block)}/${encodeURIComponent(
    path
  )}.json`;

function handleResponse<T>(
  p: Promise<T>,
  {
    window,
    requestId,
    type,
  }: {
    window: Window;
    requestId: string;
    type: string;
  }
) {
  return p.then(
    (response) => {
      // TODO(jaked) origin should be blocks-sandbox
      window.postMessage({ type, requestId, response }, "*");
    },
    (e) => {
      // Error is not always serializable
      // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
      const error = e instanceof Error ? e.message : e;
      // TODO(jaked) origin should be blocks-sandbox
      window.postMessage({ type, requestId, error }, "*");
    }
  );
}

/*
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

  const name = path.split("/").pop();

  const updatedContext = useMemo(
    () =>
      ({
        ...context,
        [type]: name,
      } as FileContext | FolderContext),
    [context, name, type]
  );
*/

/*
const onUpdateContent = useCallbackWithProps(
  ({
      path,
      context,
      updatedContents,
      setUpdatedContents,
      showUpdatedContents,
      fileData,
    }) =>
    (newContent: string) => {
      if (showUpdatedContents) {
        setUpdatedContents(
          Immer.produce(updatedContents, (updatedContents) => {
            if (newContent === updatedContents[path].original) {
              delete updatedContents[path];
            } else {
              updatedContents[path].content = newContent;
            }
          })
        );
      } else if (fileData) {
        if (onBranchTip) {
          setUpdatedContents(
            Immer.produce(updatedContents, (updatedContents) => {
              if (newContent !== fileData.content) {
                updatedContents[path] = {
                  sha: fileData.context.sha,
                  original: fileData.content,
                  content: newContent,
                };
              }
            })
          );
        }
      }
    },
  {
    path,
    context,
    updatedContents,
    setUpdatedContents,
    showUpdatedContents,
    fileData,
  }
);
*/

type BlockFrame = {
  window: Window;
  block: Block;
  context: Context;
};

function useBlockFrameMessages({
  token,
  owner,
  repo,
  branchName,
  files,
  updatedContents,
}: {
  token: string;
  owner: string;
  repo: string;
  branchName: string;
  files: RepoFiles;
  updatedContents: UpdatedContents;
}) {
  const appContext = useContext(AppContext);
  const queryClient = useQueryClient();
  const router = useRouter();

  const setProps = makeSetProps({
    queryClient,
    owner,
    repo,
    branchName,
    files,
    updatedContents,
    appContext,
  });

  const blockFrames = useRef<BlockFrame[]>([]);

  const onMessage = useRef((event: MessageEvent) => {});
  onMessage.current = (event: MessageEvent) => {
    const { data, origin, source } = event;
    // TODO(jaked) check origin is blocks-sandbox

    const blockFrame = blockFrames.current.find((bf) => bf.window === source);
    if (!blockFrame && data.type !== "loaded") return;

    switch (data.type) {
      case "loaded":
        {
          const { block, context } = JSON.parse(
            decodeURIComponent(data.hash.substring(1))
          );
          if (blockFrame) {
            const blockChanged =
              blockFrame.block.owner !== block.owner ||
              blockFrame.block.repo !== block.repo ||
              blockFrame.block.id !== block.id;
            const contextChanged =
              blockFrame.context.owner !== context.owner ||
              blockFrame.context.repo !== context.repo ||
              blockFrame.context.path !== context.path ||
              blockFrame.context.sha !== context.sha;
            if (blockChanged) {
              setBundle(blockFrame.window, block);
            }
            if (blockChanged || contextChanged) {
              setProps(blockFrame.window, block, context);
            }
            blockFrame.block = block;
            blockFrame.context = context;
          } else {
            const window = source as Window;
            const blockFrame = { window, block, context };
            blockFrames.current.push(blockFrame);
            setBundle(window, block);
            setProps(window, block, context);
          }
        }
        break;

      case "github-data--request":
        handleResponse(
          onRequestGitHubData(data.payload.path, data.payload.params, token),
          {
            window: blockFrame.window,
            requestId: data.requestId,
            type: "github-data--response",
          }
        );
        break;

      case "navigate-to-path":
        router.push(
          {
            pathname: router.pathname,
            query: { ...router.query, path: data.payload.path },
          },
          null,
          { shallow: true }
        );

      case "blocks-repos--request":
        handleResponse(
          queryClient.fetchQuery(
            QueryKeyMap.blocksRepos.factory({}),
            getAllBlocksRepos,
            {
              staleTime: 5 * 60 * 1000,
            }
          ),
          {
            window: blockFrame.window,
            requestId: data.requestId,
            type: "blocks-repos--response",
          }
        );
        break;

      case "store-get--request":
      case "store-set--request":
        {
          const { key, value } = data.payload;
          const encodedKey = encodeURIComponent(key);
          const { id, repoId } = blockFrame.block;
          const { owner, repo } = blockFrame.context;
          const storeURL = `/api/store/${repoId}/${id}/${owner}/${repo}/${encodedKey}`;

          if (data.type === "store-get--request") {
            const res = fetch(storeURL).then((res) => {
              if (res.status === 404) return undefined;
              else return res.json();
            });
            handleResponse(res, {
              window: blockFrame.window,
              requestId: data.requestId,
              type: "store-get--response",
            });
          } else {
            let res;
            if (value === undefined) {
              res = fetch(storeURL, { method: "DELETE" });
            } else {
              res = fetch(storeURL, {
                method: "PUT",
                body: JSON.stringify(value),
              });
            }
            handleResponse(
              res.then(() => undefined),
              {
                window: blockFrame.window,
                requestId: data.requestId,
                type: "store-set--response",
              }
            );
          }
        }
        break;

      /*
      case "update-metadata":
        onUpdateMetadata(
          data.payload.metadata,
          data.payload.path,
          data.payload.block,
          data.payload.currentMetadata
        );
        break;

      case "update-file":
        onUpdateContent(data.payload.content);
        break;
*/
    }
  };

  useEffect(() => {
    const onMessageInstance = (event: MessageEvent) => {
      onMessage.current(event);
    };

    addEventListener("message", onMessageInstance);
    return () => removeEventListener("message", onMessageInstance);
  }, []);
}

export default useBlockFrameMessages;
