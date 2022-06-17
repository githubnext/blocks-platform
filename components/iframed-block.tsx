import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Block,
  BlocksRepo,
  FileContext,
  FolderContext,
  onRequestGitHubData,
} from "@githubnext/blocks";
import {
  getAllBlocksRepos,
  getFileContent,
  getFolderContent,
  RepoFiles,
} from "ghapi";
import axios from "axios";
import { QueryKeyMap } from "lib/query-keys";
import { useQueryClient } from "react-query";
import { FileKeyParams, FolderKeyParams } from "lib/query-keys";
import { useRouter } from "next/router";
import { AppContext, Content, StagedContent } from "context";
import { getBlockKey } from "hooks";

type IFramedBlockProps = {
  block: Block;
  contents?: string;
  originalContent?: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  metadata: any;
  isEditable: boolean;
};

type BlockInstance = {
  id: string;
  block: Block;
  bundle: Asset[];
  context: FileContext | FolderContext;
};

type StashedBlockProps = {
  metadata: Record<string, any>;
  content?: string;
  tree?: RepoFiles;
};

export default ({
  block,
  contents,
  originalContent,
  isEditable,
  tree,
  context,
  metadata,
}: IFramedBlockProps) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [blockInstances, setBlockInstances] = React.useState<BlockInstance[]>(
    []
  );
  const [blockBundles, setBlockBundles] = React.useState<
    Record<string, Asset[]>
  >({});
  const [blockProps, setBlockProps] = React.useState<
    Record<string, StashedBlockProps>
  >({});

  const queryClient = useQueryClient();
  const { token, stagedContent, setStagedContent, setRequestedContent } =
    useContext(AppContext);

  const router = useRouter();
  const query = router.query;

  const getFileContentLocal = async (params: FileKeyParams) => {
    if (stagedContent[params.path]) return stagedContent[params.path].content;
    try {
      const res = await queryClient.fetchQuery(
        [QueryKeyMap.file.key, params],
        (queryParams) => {
          return getFileContent({
            ...queryParams,
            queryKey: [queryParams.queryKey[0][0], params],
          });
        }
      );
      return res.content;
    } catch (e) {
      return null;
    }
  };
  const getFolderContentLocal = async (params: FolderKeyParams) => {
    try {
      const res = await queryClient.fetchQuery(
        QueryKeyMap.folder.key,
        (queryParams) => {
          return getFolderContent({
            ...queryParams,
            queryKey: [queryParams.queryKey[0], params],
          });
        }
      );
      return res.tree;
    } catch (e) {
      return null;
    }
  };

  const getMetadata = async (
    context: FileContext | FolderContext,
    block: Block
  ) => {
    const url = block.entry && getMetadataPath(block, context.path);
    return await getFileContentLocal({
      repo: context.repo,
      owner: context.owner,
      path: url,
      fileRef: context.sha,
    });
  };

  const getBlockProps = async (
    context: FileContext | FolderContext,
    block: Block
  ) => {
    const metadata = await getMetadata(context, block);
    const content =
      block.type !== "file"
        ? undefined
        : await getFileContentLocal({
            repo: context.repo,
            owner: context.owner,
            path: context.path,
            fileRef: context.sha,
          });
    const tree =
      block.type === "folder"
        ? await getFolderContentLocal({
            repo: context.repo,
            owner: context.owner,
            path: context.path,
            fileRef: context.sha,
          })
        : undefined;
    return {
      metadata,
      content,
      tree,
    };
  };

  const fetchBlockBundleIfNeeded = async ({ block }: { block: Block }) => {
    const blockKey = getBlockKey(block);
    const bundle = blockBundles[blockKey] || (await getBundle(block));
    setBlockBundles((blockBundles: Record<string, Asset[]>) => ({
      ...blockBundles,
      [blockKey]: bundle,
    }));
  };

  const fetchBlockPropsIfNeeded = async ({
    block,
    context,
  }: {
    block: Block;
    context: FileContext | FolderContext;
  }) => {
    const propsKey = getBlockInstanceKey(block, context);
    const props = blockProps[propsKey] || (await getBlockProps(context, block));
    setBlockProps((blockProps: Record<string, StashedBlockProps>) => ({
      ...blockProps,
      [propsKey]: props,
    }));
  };

  const getStagedContent = (blockInstance: BlockInstance): Content => {
    return stagedContent[blockInstance.context?.path];
  };

  const iframeProps = {
    instances: blockInstances.reduce((acc, instance) => {
      const stagedContentForInstance = getStagedContent(instance);
      const blockPropsInstanceKey = getBlockInstanceKey(
        instance.block,
        instance.context
      );
      const blockPropsForInstance = blockProps[blockPropsInstanceKey];
      const isRoot = instance.id === "root";
      const blockKey = getBlockKey(instance.block);
      const instanceInfo = isRoot
        ? {
            block,
            context,
            bundle: blockBundles[blockKey],
            blockProps: {
              context,
              content: stagedContentForInstance?.content || contents,
              originalContent: stagedContentForInstance?.original || contents,
              tree: tree,
              metadata: metadata,
              isEditable,
            },
          }
        : {
            block: instance.block,
            context: instance.context,
            bundle: blockBundles[blockKey],
            blockProps: {
              context: instance.context,
              content:
                stagedContentForInstance?.content ||
                blockPropsForInstance?.content,
              originalContent:
                stagedContentForInstance?.original ||
                blockPropsForInstance?.content,
              tree: blockPropsForInstance?.tree,
              metadata: blockPropsForInstance?.metadata,
              isEditable,
            },
          };
      acc[instance.id] = instanceInfo;
      return acc;
    }, {}),
  };
  console.log({ blockInstances, iframeProps });
  const callbacks = {
    // block handling callback functions
    onUpdateInstance: async ({
      payload,
      block: instanceBlock,
      context: instanceContext,
    }) => {
      const instance = {
        id: payload.id,
        block: payload.id === "root" ? block : instanceBlock,
        context: payload.id === "root" ? context : instanceContext,
      };
      console.log("onUpdateInstance, instance", instance);
      setBlockInstances((blockInstances) => {
        const existingInstanceIndex = blockInstances.findIndex(
          (instance) => instance.id === payload.id
        );
        if (existingInstanceIndex === -1) {
          return [...blockInstances, instance];
        } else {
          const newBlockInstances = [...blockInstances];
          newBlockInstances[existingInstanceIndex] = instance;
          return newBlockInstances;
        }
      });
      fetchBlockBundleIfNeeded({ block: instance.block });
      fetchBlockPropsIfNeeded({
        block: instance.block,
        context: instance.context,
      });
    },
    onDestroyInstance: async ({ payload, block, context }) => {
      const newBlockInstances = blockInstances.filter(
        (instance) => instance.id !== payload.id
      );
      setBlockInstances(newBlockInstances);
    },

    // block callback functions
    updateMetadata: async ({ payload, block, context }) => {
      const blockKey = getBlockKey(block);
      setRequestedContent({
        path: `.github/blocks/${block.type}/${blockKey}.json`,
        newCode: JSON.stringify(payload.metadata, null, 2),
        currentCode: payload.metadata,
        // onSubmit: () => {
        //   setTimeout(() => {
        //     window.postMessage({
        //       type: "updated-metadata",
        //       path: requestedMetadataPath,
        //     });
        //   }, 1000);
        // },
      });
    },

    onUpdateContent: async ({ payload, block, context }) => {
      setStagedContent((stagedContent: StagedContent) => {
        const currentStagedContentForPath = stagedContent[context.path];
        const newStagedContentForPath = {
          original: currentStagedContentForPath?.original || "",
          content: payload.content,
          sha: context.sha,
        };
        return {
          ...stagedContent,
          [context.path]: newStagedContentForPath,
        };
      });
    },
    onNavigateToPath: async ({ payload, block, context }) => {
      console.log("onNavigateToPath", payload);
      router.push(
        {
          pathname: router.pathname,
          query: { ...query, path: payload.path },
        },
        null,
        { shallow: true }
      );
    },
    onRequestGitHubData: async ({ payload, block, context }) => {
      return onRequestGitHubData(payload.path, payload.params, token);
    },

    onStoreGet: async ({ payload, block, context }) => {
      const res = await fetch(
        makeStoreURL(context.owner, context.repo, payload.key, block)
      );
      if (res.status === 404) return undefined;
      else return await res.json();
    },
    onStoreSet: async ({ payload, block, context }) => {
      const options =
        payload.value === undefined
          ? { method: "DELETE" }
          : { method: "PUT", body: JSON.stringify(payload.value) };
      return fetch(
        makeStoreURL(context.owner, context.repo, payload.key, block),
        options
      ).then((_) => undefined);
    },

    onRequestBlocksRepos: async ({ payload, block, context }) => {
      console.log("onRequestBlocksRepos");
      return queryClient.fetchQuery(
        QueryKeyMap.blocksRepos.factory({
          path: payload.path,
        }),
        getAllBlocksRepos
      );
    },
  };

  useIframeInterface(iframeRef, iframeProps, callbacks);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full"
      sandbox="allow-scripts allow-same-origin"
      src={process.env.NEXT_PUBLIC_SANDBOX_DOMAIN}
      // src={`/block-iframe/${block.owner}/${block.repo}/${block.id}`}
    />
  );
};

type Callback = ({
  payload,
  block,
  context: {},
}: {
  payload: Record<string, any>;
  block: Block;
  context?: FileContext | FolderContext;
}) => Promise<any>;

const useIframeInterface = (
  iframeRef: React.RefObject<HTMLIFrameElement>,
  props: Record<string, any>,
  callbacks: Record<string, Callback>
) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const stringifiedProps = JSON.stringify(props);

  useEffect(() => {
    if (!isLoaded) return;
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "setProps",
        props,
      },
      "*"
    );
  }, [stringifiedProps, iframeRef.current, isLoaded]);

  useEffect(() => {
    // setIsLoaded(false);
    const onMessageInstance = async (event: MessageEvent) => {
      if (!iframeRef.current) return;
      const { data, source } = event;
      if (source !== iframeRef.current.contentWindow) return;
      if (data.type === "loaded") {
        setIsLoaded(true);
      }
      const callbackFunction = callbacks[data.type];
      if (!callbackFunction) return;
      callbackFunction({
        payload: data.payload,
        block: data.block,
        context: data.context,
      }).then(
        (response) => {
          iframeRef.current.contentWindow.postMessage(
            {
              type: `response:${data.type}`,
              requestId: data.requestId,
              response,
            },
            "*"
          );
        },
        (e) => {
          // Error is not always serializable
          // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
          const error = e instanceof Error ? e.message : e;
          window.postMessage(
            {
              type: `response:${data.type}`,
              requestId: data.requestId,
              error,
            },
            "*"
          );
        }
      );
    };

    addEventListener("message", onMessageInstance);
    return () => removeEventListener("message", onMessageInstance);
  }, [isLoaded]);
};

type Asset = {
  name: string;
  content: string;
};

const getBundle = async (block: Block) => {
  console.log("getBundle", block);
  const url = `/api/get-block-content?owner=${block.owner}&repo=${block.repo}&id=${block.id}`;
  const bundle = await axios(url)
    .then((res) => res.data)
    .catch((e) => {
      console.error(e);
      return null;
    });
  console.log(bundle);
  return bundle?.content;
};

export const getMetadataPath = (block, path) =>
  `.github/blocks/${block?.type}/${getBlockKey(block)}/${encodeURIComponent(
    path
  )}.json`;

const makeStoreURL = (owner: string, repo: string, key: string, block: Block) =>
  `/api/store/${block.repoId}/${block.id}/${owner}/${repo}/${encodeURIComponent(
    key
  )}`;

const getBlockInstanceKey = (
  block: Block,
  context: FileContext | FolderContext
): string => {
  const blockKey = getBlockKey(block);
  const contextKey = [context.owner, context.repo, context.path].join("/");
  return `${blockKey}/${contextKey}`;
};
