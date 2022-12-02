import path from "path";
import * as Immer from "immer";
import { useContext, useEffect, useRef } from "react";
import { useQueryClient, QueryClient } from "react-query";
import getConfig from "next/config";
import { useRouter } from "next/router";
import type { Block, RepoFiles } from "@githubnext/blocks";
import { QueryKeyMap } from "lib/query-keys";
import type { BlocksQueryMeta } from "ghapi";
import {
  getBlocksRepos,
  getBlocksFromRepo,
  getFileContent,
  getFolderContent,
  getMetadata,
} from "ghapi";
import { getBlockKey } from "hooks";
import type { AppContextValue } from "context";
import { AppContext } from "context";
import { Context, UpdatedContents } from "./index";
import axios from "axios";
import makeBranchPath from "utils/makeBranchPath";
import { Octokit } from "@octokit/rest";

const { publicRuntimeConfig } = getConfig();

const onRequestGitHubData = async (path: string, token?: string) => {
  const octokit = new Octokit({
    auth: token,
  });
  const res = await octokit.request(path);
  return res.data;
};

type BlockFrame = {
  window: Window;
  origin: string;
  block: Block;
  context: Context;
  props: any;
};

const getMetadataPath = (block: Block, path: string) =>
  `.github/blocks/${block.type}/${getBlockKey(block)}/${encodeURIComponent(
    path
  )}.json`;

const setBundle = async (
  devServerInfo: DevServerInfo,
  blockFrame: BlockFrame,
  block: Block | null
) => {
  let bundle = null;
  if (
    devServerInfo &&
    block &&
    block.owner === devServerInfo.owner &&
    block.repo === devServerInfo.repo
  ) {
    // empty bundle means load code locally
    bundle = [];
  } else if (block) {
    const url = `/api/get-block-content?owner=${block.owner}&repo=${block.repo}&id=${block.id}`;
    const res = await fetch(url);
    if (res.ok) {
      bundle = await res.json().then((bundle) => bundle.content);
    } else {
      console.error(res);
    }
  }
  blockFrame.window?.postMessage(
    { type: "setProps", props: { bundle } },
    blockFrame.origin
  );
};

const setProps = (blockFrame: BlockFrame, props: any) => {
  blockFrame.props = props;
  blockFrame.window?.postMessage(
    { type: "setProps", props: { props } },
    blockFrame.origin
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
    if (!block) return;

    const path = context.path;
    const name = path.split("/").pop();

    const isSameRepo = context.owner === owner && context.repo === repo;

    // fetch metadata for the block and path
    const metadataPath = getMetadataPath(block, path);
    const metadata = queryClient.fetchQuery(
      QueryKeyMap.file.factory({
        owner: context.owner,
        repo: context.repo,
        path: encodeURIComponent(metadataPath),
        // TODO branchName doesn't make sense for a file in another repo
        // maybe metadata should always be on main?
        fileRef: isSameRepo ? branchName : "HEAD",
      }),
      getMetadata,
      {
        retry: false,
        staleTime: 5 * 60 * 1000,
      }
    );

    let isFolder = block.type === "folder";
    let fileSize = 0;
    if (isSameRepo && path) {
      const file = files && files.find((d) => d.path === path);
      if (file) {
        fileSize = file.size;
      }
    }

    // fetch content for the path
    if (isFolder) {
      const treeData = queryClient.fetchQuery(
        QueryKeyMap.folder.factory({ ...context, fileRef: context.sha }),
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
          files,
          tree: treeData.tree,
        };
        setProps(blockFrame, props);
      });
    } else {
      const fileSizeLimit = 1500000; // 1.5Mb
      // TODO(jaked) handle too-largeness
      const isTooLarge = fileSize > fileSizeLimit;

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
          files,
          content,
          originalContent,
          isEditable,
        };
        setProps(blockFrame, props);
      });
    }
  };

async function getBlockFromPartial({
  queryClient,
  partialBlock,
  devServerInfo,
}: {
  queryClient: QueryClient;
  partialBlock: Partial<Block>;
  devServerInfo?: DevServerInfo;
}): Promise<Block | null> {
  const repoInfo = await queryClient.fetchQuery(
    QueryKeyMap.blocksRepo.factory({
      owner: partialBlock.owner,
      repo: partialBlock.repo,
      devServerInfo,
    }),
    getBlocksFromRepo,
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  return repoInfo?.blocks?.find((b) => b.id === partialBlock.id) || null;
}

async function handleLoaded({
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
  origin,
  data,
}: {
  queryClient: QueryClient;
  appContext: AppContextValue;
  owner: string;
  repo: string;
  branchName: string;
  files: RepoFiles;
  updatedContents: UpdatedContents;
  blockFrames: React.MutableRefObject<BlockFrame[]>;
  blockFrame: BlockFrame;
  window: Window;
  origin: string;
  data: any;
}) {
  const devServerInfo = appContext.devServerInfo;

  const setInitialProps = makeSetInitialProps({
    queryClient,
    appContext,
    owner,
    repo,
    branchName,
    files,
    updatedContents,
  });

  const { block: partialBlock, context } = JSON.parse(
    decodeURIComponent(data.hash.substring(1))
  );

  if (blockFrame) {
    const blockChanged =
      blockFrame.block.owner !== partialBlock.owner ||
      blockFrame.block.repo !== partialBlock.repo ||
      blockFrame.block.id !== partialBlock.id;
    const contextChanged =
      blockFrame.context.owner !== context.owner ||
      blockFrame.context.repo !== context.repo ||
      blockFrame.context.path !== context.path ||
      blockFrame.context.sha !== context.sha;

    if (blockChanged) {
      blockFrame.block = await getBlockFromPartial({
        queryClient,
        partialBlock,
        devServerInfo,
      });
    }

    blockFrame.context = context;

    if (blockChanged) {
      // TODO(jaked) update block atomically
      setBundle(devServerInfo, blockFrame, blockFrame.block);
      const props = { ...blockFrame.props, block: blockFrame.block };
      setProps(blockFrame, props);
    }

    if (contextChanged) {
      setInitialProps(blockFrame);
    }

    // hot reload of iframe
    if (!blockChanged && !contextChanged) {
      setBundle(devServerInfo, blockFrame, blockFrame.block);
      setInitialProps(blockFrame);
    }
  } else {
    const block = await getBlockFromPartial({
      queryClient,
      partialBlock,
      devServerInfo,
    });

    const blockFrame = { window, origin, block, context, props: {} };
    blockFrames.current.push(blockFrame);
    setBundle(devServerInfo, blockFrame, block);
    setInitialProps(blockFrame);
  }
}

function sendResponse({
  response,
  type,
  blockFrame,
  requestId,
  error,
}: {
  response?: any;
  type: string;
  blockFrame: BlockFrame;
  requestId: string;
  error?: string;
}) {
  blockFrame.window?.postMessage(
    { type: `${type}--response`, requestId, response, error },
    blockFrame.origin
  );
}
function handleResponse<T>(
  p: Promise<T>,
  {
    type,
    blockFrame,
    requestId,
  }: {
    type: string;
    blockFrame: BlockFrame;
    requestId: string;
  }
) {
  return p.then(
    (response) => {
      sendResponse({ type, requestId, blockFrame, response });
    },
    (e) => {
      // Error is not always serializable
      // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
      const error = e instanceof Error ? e.message : e;
      sendResponse({ type, requestId, blockFrame, error });
    }
  );
}

function makeStoreURL(block: Block, context: Context, key: string) {
  // prevent path traversal attacks
  const safeKey = path.resolve(key).substring(1);

  const encodedKey = encodeURIComponent(safeKey);
  const { id, owner: blockOwner, repo: blockRepo } = block;
  const { owner, repo } = context;
  return `/api/store/${blockOwner}/${blockRepo}/${id}/${owner}/${repo}/${encodedKey}`;
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
  owner,
  repo,
  branchName,
  files,
  updatedContents,
  setUpdatedContents,
  setRequestedMetadata,
  committedContents,
}: {
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
  committedContents: Record<string, string>;
}) {
  const appContext = useContext(AppContext);
  const { devServerInfo } = appContext;
  const queryClient = useQueryClient();
  const router = useRouter();
  const { token } = queryClient.getDefaultOptions().queries
    .meta as BlocksQueryMeta;

  const blockFrames = useRef<BlockFrame[]>([]);

  for (const blockFrame of blockFrames.current) {
    if (blockFrame.props.isEditable) {
      const path = blockFrame.context.path;
      if (path in committedContents) {
        const originalContent = committedContents[path];
        const content = originalContent;
        const props = { ...blockFrame.props, content, originalContent };
        setProps(blockFrame, props);
      } else if (path in updatedContents) {
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
  for (const path of Object.keys(committedContents)) {
    delete committedContents[path];
  }

  const onMessage = useRef((event: MessageEvent) => {});
  onMessage.current = (event: MessageEvent) => {
    const { data, origin, source } = event;
    if (
      !publicRuntimeConfig.sandboxDomain.startsWith(origin) &&
      !devServerInfo?.devServer.startsWith(origin)
    )
      return;

    blockFrames.current = blockFrames.current.filter(
      (bf) => bf.window && !bf.window.closed
    );
    const blockFrame = blockFrames.current.find((bf) => bf.window === source);
    if (!blockFrame && data.type !== "loaded") return;

    const baseType = data.type.split("--")[0];
    const responseParams = {
      type: baseType,
      requestId: data.requestId,
      blockFrame,
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
          blockFrames,
          blockFrame,
          window: source as Window,
          origin,
          data,
        });

      // handle Block callback functions by name
      case "onRequestGitHubData":
        return handleResponse(
          onRequestGitHubData(data.payload.path, token),
          responseParams
        );

      case "onRequestBlocksRepos":
        return handleResponse(
          queryClient.fetchQuery(
            QueryKeyMap.blocksRepos.factory({
              ...data.payload.params,
              devServerInfo,
            }),
            getBlocksRepos,
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
            query: {
              ...router.query,
              branchPath: makeBranchPath(branchName, data.payload.path),
            },
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
        if (blockFrame.block.owner !== "githubnext") return;
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
