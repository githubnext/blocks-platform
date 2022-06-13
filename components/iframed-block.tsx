import React, { useEffect, useRef } from "react";
import {
  Block,
  BlocksRepo,
  FileContext,
  FolderContext,
} from "@githubnext/blocks";
import { getFileContent, getFolderContent, RepoFiles } from "ghapi";
import axios from "axios";
import { getMetadataPath } from "./general-block";
import { QueryKeyMap } from "lib/query-keys";
import { useQueryClient } from "react-query";
import { FileKeyParams, FolderKeyParams } from "lib/query-keys";

type IFramedBlockProps = {
  block: Block;
  contents?: string;
  originalContent?: string;
  tree?: RepoFiles;
  context: FileContext | FolderContext;
  metadata: any;
  isEditable: boolean;
  onUpdateMetadata: (
    newMetadata: any,
    path: string,
    block: Block,
    currentMetadata: any
  ) => void;
  onUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (
    path: string,
    params?: Record<string, any>
  ) => Promise<any>;
  onStoreGet: (key: string) => Promise<any>;
  onStoreSet: (key: string, value: any) => Promise<void>;
  onNavigateToPath: (path: string) => void;
  onRequestBlocksRepos: () => Promise<BlocksRepo[]>;
};

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
      window.postMessage({ type, requestId, response }, "*");
    },
    (e) => {
      // Error is not always serializable
      // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
      const error = e instanceof Error ? e.message : e;
      window.postMessage({ type, requestId, error }, "*");
    }
  );
}

export default ({
  block,
  contents,
  originalContent,
  isEditable,
  tree,
  context,
  metadata,
  onUpdateMetadata,
  onUpdateContent,
  onRequestGitHubData,
  onStoreGet,
  onStoreSet,
  onRequestBlocksRepos,
  onNavigateToPath,
}: IFramedBlockProps) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [bundle, setBundle] = React.useState<Asset[] | undefined>(undefined);
  const [blockProps, setBlockProps] = React.useState<any>({});
  const queryClient = useQueryClient();

  const getFileContentLocal = async (params: FileKeyParams) => {
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

  const onMessage = useRef((event: MessageEvent) => {});
  onMessage.current = (event: MessageEvent) => {
    if (!iframeRef.current) return;
    const { data, origin, source } = event;
    if (source !== iframeRef.current.contentWindow) return;
    const window = source as Window;
    switch (data.type) {
      case "loaded":
        setIsLoaded(true);
        break;

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

      case "navigate-to-path":
        onNavigateToPath(data.payload.path);
        break;

      case "github-data--request":
        handleResponse(
          onRequestGitHubData(data.payload.path, data.payload.params),
          {
            window,
            requestId: data.requestId,
            type: "github-data--response",
          }
        );
        break;

      case "store-get--request":
        handleResponse(onStoreGet(data.payload.key), {
          window,
          requestId: data.requestId,
          type: "store-get--response",
        });
        break;

      case "store-set--request":
        handleResponse(onStoreSet(data.payload.key, data.payload.value), {
          window,
          requestId: data.requestId,
          type: "store-set--response",
        });
        break;

      case "blocks-repos--request":
        handleResponse(onRequestBlocksRepos(data.payload.path), {
          window,
          requestId: data.requestId,
          type: "blocks-repos--response",
        });
        break;

      case "get-bundle--request":
        handleResponse(getBundle(data.payload.block), {
          window,
          requestId: data.requestId,
          type: "get-bundle--response",
        });
        break;
      case "get-props--request":
        handleResponse(
          getBlockProps(data.payload.context, data.payload.block),
          {
            window,
            requestId: data.requestId,
            type: "get-bundle--response",
          }
        );
        break;
    }
  };

  useEffect(() => {
    const onMessageInstance = (event: MessageEvent) => {
      onMessage.current(event);
    };

    addEventListener("message", onMessageInstance);
    return () => removeEventListener("message", onMessageInstance);
  }, []);

  const updateBundle = () => {
    if (!isLoaded) return;
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "set-bundle",
        bundle,
      },
      "*"
    );
  };
  const updateProps = () => {
    if (!isLoaded) return;
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "set-props",
        props: {
          block,
          context,
          content: contents,
          originalContent,
          isEditable,
          tree,
          metadata,
        },
      },
      "*"
    );
  };
  useEffect(() => {
    updateBundle();
  }, [bundle, isLoaded]);
  useEffect(() => {
    updateProps();
  }, [
    block.owner,
    block.repo,
    block.id,
    context.owner,
    context.repo,
    context.path,
    context.sha,
    contents,
    isEditable,
    tree,
    metadata,
    isLoaded,
  ]);

  const fetchBundle = async () => {
    // setBundle(undefined);
    const bundle = await getBundle(block);
    setBundle(bundle);
  };
  useEffect(() => {
    fetchBundle();
  }, [block.owner, block.repo, block.id]);

  return (
    <iframe
      className={"w-full h-full"}
      ref={iframeRef}
      sandbox={"allow-scripts allow-same-origin"}
      src={`${process.env.NEXT_PUBLIC_SANDBOX_DOMAIN}/${block.owner}/${block.repo}/${block.id}`}
      // src={`/block-iframe/${block.owner}/${block.repo}/${block.id}`}
    />
  );
};

type Asset = {
  name: string;
  content: string;
};

const getBundle = async (block: Block) => {
  const url = `/api/get-block-content?owner=${block.owner}&repo=${block.repo}&id=${block.id}`;
  const bundle = await axios(url)
    .then((res) => res.data)
    .catch((e) => {
      console.error(e);
      return null;
    });
  return bundle?.content;
};
