import path from "path";
import * as Immer from "immer";
import { useContext, useEffect, useRef, useState } from "react";
import { useQueryClient, QueryClient } from "react-query";
import getConfig from "next/config";
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
import axios from "axios";

const { publicRuntimeConfig } = getConfig();

type BlockFrame = {
  window: Window;
  block: Block;
  context: Context;
  props: any;
};

const getMetadataPath = (block: Block, path: string) =>
  `.github/blocks/${block.type}/${getBlockKey(block)}/${encodeURIComponent(
    path
  )}.json`;

const setBundle = async (window: Window, block: Block) => {
  const url = `/api/get-block-content?owner=${block.owner}&repo=${block.repo}&id=${block.id}`;
  const res = await fetch(url);
  if (res.ok) {
    const bundle = await res.json();
    window.postMessage(
      { type: "setProps", props: { bundle: bundle.content } },
      publicRuntimeConfig.sandboxDomain
    );
  } else {
    console.error(res);
  }
};

const setProps = (blockFrame: BlockFrame, props: any) => {
  blockFrame.props = props;
  blockFrame.window.postMessage(
    { type: "setProps", props: { props } },
    publicRuntimeConfig.sandboxDomain
  );
};

const makeSetInitialProps =
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
  (blockFrame: BlockFrame) => {
    const { block, context } = blockFrame;
    const path = context.path;
    const name = path.split("/").pop();

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
        : (files && files.find((d) => d.path === path)) || { type: "tree" };
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
        const props = {
          block,
          context: { ...context, folder: name },
          metadata,
          tree: treeData.tree,
        };
        setProps(blockFrame, props);
      });
    } else {
      const size = fileInfo.size || 0;
      const fileSizeLimit = 1500000; // 1.5Mb
      // TODO(jaked) handle too-largeness
      const isTooLarge = size > fileSizeLimit;

      const onBranchTip = context.sha === branchName;
      const showUpdatedContents = onBranchTip && updatedContents[path];

      let fileData: Promise<{ content: string }>;
      if (showUpdatedContents) {
        fileData = Promise.resolve(undefined);
      } else {
        fileData = queryClient.fetchQuery(
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
      }

      Promise.all([metadata, fileData]).then(([metadata, fileData]) => {
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

        const props = {
          block,
          context: { ...context, file: name },
          metadata,
          content,
          originalContent,
          isEditable,
        };
        setProps(blockFrame, props);
      });
    }
  };

function handleLoaded({
  queryClient,
  appContext,
  owner,
  repo,
  branchName,
  files,
  updatedContents,
  blockFrames,
  blockFrame,
  window,
  data,
}: {
  queryClient: QueryClient;
  appContext: AppContextValue;
  owner: string;
  repo: string;
  branchName: string;
  files: RepoFiles;
  updatedContents: UpdatedContents;
  blockFrames: BlockFrame[];
  blockFrame: BlockFrame;
  window: Window;
  data: any;
}) {
  const setInitialProps = makeSetInitialProps({
    queryClient,
    appContext,
    owner,
    repo,
    branchName,
    files,
    updatedContents,
  });

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

    blockFrame.block = block;
    blockFrame.context = context;

    if (blockChanged) {
      // TODO(jaked) update block atomically
      setBundle(blockFrame.window, block);
      const props = { ...blockFrame.props, block };
      setProps(blockFrame, props);
    }
    if (contextChanged) {
      setInitialProps(blockFrame);
    }
  } else {
    const blockFrame = { window, block, context, props: {} };
    blockFrames.push(blockFrame);
    setBundle(window, block);
    setInitialProps(blockFrame);
  }
}

function sendResponse({
  response,
  type,
  window,
  requestId,
  error,
}: {
  response?: any;
  type: string;
  window: Window;
  requestId: string;
  error?: string;
}) {
  window.postMessage(
    { type: `${type}--response`, requestId, response, error },
    publicRuntimeConfig.sandboxDomain
  );
}
function handleResponse<T>(
  p: Promise<T>,
  {
    type,
    window,
    requestId,
  }: {
    type: string;
    window: Window;
    requestId: string;
  }
) {
  return p.then(
    (response) => {
      sendResponse({ type, requestId, window, response });
    },
    (e) => {
      // Error is not always serializable
      // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
      const error = e instanceof Error ? e.message : e;
      sendResponse({ type, requestId, window, error });
    }
  );
}

function makeStoreURL(block: Block, context: Context, key: string) {
  // prevent path traversal attacks
  const safeKey = path.resolve(key).substring(1);

  const encodedKey = encodeURIComponent(safeKey);
  const { id, repoId } = block;
  const { owner, repo } = context;
  return `/api/store/${repoId}/${id}/${owner}/${repo}/${encodedKey}`;
}

function handleStoreGetRequest({
  blockFrame,
  data,
}: {
  blockFrame: BlockFrame;
  data: any;
}) {
  const { key } = data.payload;
  const storeURL = makeStoreURL(blockFrame.block, blockFrame.context, key);

  const res = fetch(storeURL).then((res) => {
    if (res.status === 404) return undefined;
    else return res.json();
  });
  return res;
}

function handleStoreSetRequest({
  blockFrame,
  data,
}: {
  blockFrame: BlockFrame;
  data: any;
}) {
  const { key, value } = data.payload;
  const storeURL = makeStoreURL(blockFrame.block, blockFrame.context, key);

  let res;
  if (value === undefined) {
    res = fetch(storeURL, { method: "DELETE" });
  } else {
    res = fetch(storeURL, {
      method: "PUT",
      body: JSON.stringify(value),
    });
  }
  return res.then(() => undefined);
}

function handleUpdateFile({
  updatedContents,
  setUpdatedContents,
  blockFrame,
  data,
}: {
  updatedContents: UpdatedContents;
  setUpdatedContents: (_: UpdatedContents) => void;
  blockFrame: BlockFrame;
  data: any;
}) {
  const context = blockFrame.context;
  const path = context.path;
  const newContent = data.payload.content;

  if (!blockFrame.props.isEditable) return;

  // avoid calling `setProps` on the block that caused the update
  blockFrame.props.content = newContent;

  if (path in updatedContents) {
    setUpdatedContents(
      Immer.produce(updatedContents, (updatedContents) => {
        if (newContent === updatedContents[path].original) {
          delete updatedContents[path];
        } else {
          updatedContents[path].content = newContent;
        }
      })
    );
  } else {
    const content = blockFrame.props.originalContent;
    const sha = blockFrame.props.context.sha;

    setUpdatedContents(
      Immer.produce(updatedContents, (updatedContents) => {
        if (newContent !== content) {
          updatedContents[path] = {
            sha,
            original: content,
            content: newContent,
          };
        }
      })
    );
  }
}

function handleUpdateMetadata({
  setRequestedMetadata,
  blockFrame,
  metadata,
}: {
  setRequestedMetadata: (_: {
    path: string;
    current: string;
    new: string;
    onSubmit: () => void;
  }) => void;
  blockFrame: BlockFrame;
  metadata: any;
}) {
  setRequestedMetadata({
    path: getMetadataPath(blockFrame.block, blockFrame.context.path),
    current: JSON.stringify(blockFrame.props.metadata, undefined, 2),
    new: JSON.stringify(metadata, undefined, 2),
    onSubmit: () => {
      setProps(blockFrame, { ...blockFrame.props, metadata });
    },
  });
}

async function handleFetchInternalEndpoint(urlPath, params) {
  const safePath = path.resolve(urlPath).substring(1);
  const res = await axios(`/${safePath}`, params);
  return {
    data: res.data,
    status: res.status,
  };
}

function useBlockFrameMessages({
  token,
  owner,
  repo,
  branchName,
  files,
  updatedContents,
  setUpdatedContents,
  setRequestedMetadata,
}: {
  token: string;
  owner: string;
  repo: string;
  branchName: string;
  files: RepoFiles;
  updatedContents: UpdatedContents;
  setUpdatedContents: (_: UpdatedContents) => void;
  setRequestedMetadata: (_: {
    path: string;
    current: string;
    new: string;
    onSubmit: () => void;
  }) => void;
}) {
  const appContext = useContext(AppContext);
  const queryClient = useQueryClient();
  const router = useRouter();

  const blockFrames = useRef<BlockFrame[]>([]);

  for (const blockFrame of blockFrames.current) {
    if (blockFrame.props.isEditable) {
      const path = blockFrame.context.path;
      if (path in updatedContents) {
        const { content } = updatedContents[path];
        if (blockFrame.props.content !== content) {
          const props = { ...blockFrame.props, content };
          setProps(blockFrame, props);
        }
      } else {
        const { content, originalContent } = blockFrame.props;
        if (content !== originalContent) {
          const props = { ...blockFrame.props, content: originalContent };
          setProps(blockFrame, props);
        }
      }
    }
  }

  const onMessage = useRef((event: MessageEvent) => {});
  onMessage.current = (event: MessageEvent) => {
    const { data, origin, source } = event;
    if (origin !== publicRuntimeConfig.sandboxDomain) return;

    blockFrames.current = blockFrames.current.filter((bf) => !bf.window.closed);
    const blockFrame = blockFrames.current.find((bf) => bf.window === source);
    if (!blockFrame && data.type !== "loaded") return;

    const baseType = data.type.split("--")[0];
    const responseParams = {
      type: baseType,
      requestId: data.requestId,
      window: blockFrame?.window,
    };

    switch (baseType) {
      case "loaded":
        return handleLoaded({
          queryClient,
          appContext,
          owner,
          repo,
          branchName,
          files,
          updatedContents,
          blockFrames: blockFrames.current,
          blockFrame,
          window: source as Window,
          data,
        });

      // handle Block callback functions by name
      case "onRequestGitHubData":
        return handleResponse(
          onRequestGitHubData(data.payload.path, data.payload.params, token),
          responseParams
        );

      case "onRequestBlocksRepos":
        return handleResponse(
          queryClient.fetchQuery(
            QueryKeyMap.blocksRepos.factory({}),
            getAllBlocksRepos,
            {
              staleTime: 5 * 60 * 1000,
            }
          ),
          responseParams
        );

      case "onStoreGet":
        return handleResponse(
          handleStoreGetRequest({ blockFrame, data }),
          responseParams
        );

      case "onStoreSet":
        return handleResponse(
          handleStoreSetRequest({ blockFrame, data }),
          responseParams
        );

      case "onNavigateToPath":
        router.push(
          {
            pathname: router.pathname,
            query: { ...router.query, path: data.payload.path },
          },
          null,
          { shallow: true }
        );
        sendResponse(responseParams);
        return;

      case "onUpdateContent":
        handleUpdateFile({
          updatedContents,
          setUpdatedContents,
          blockFrame,
          data,
        });
        sendResponse(responseParams);
        return;

      case "onUpdateMetadata":
        handleUpdateMetadata({
          setRequestedMetadata,
          blockFrame,
          metadata: data.payload.metadata,
        });
        sendResponse(responseParams);

      case "private__onFetchInternalEndpoint":
        if (blockFrame.context.owner !== "githubnext") return;
        return handleResponse(
          handleFetchInternalEndpoint(data.payload.path, data.payload.params),
          responseParams
        );
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
