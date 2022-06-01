import {
  SandpackProvider,
  SandpackPreview,
} from "@codesandbox/sandpack-react/dist/cjs/index.js";
import {
  FileContext,
  FolderContext,
  RepoFiles,
  bundleCodesandboxFiles,
} from "@githubnext/blocks";
import uniqueId from "lodash/uniqueId";
import React, { useEffect, useMemo, useRef } from "react";
import { useBlockContent } from "../hooks";

export interface BundleCode {
  name: string;
  content: string;
}
interface SandboxedBlockProps {
  block: Block;
  contents?: string;
  originalContent?: string;
  isEditable?: boolean;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext;
  onUpdateMetadata: (newMetadata: any) => void;
  onUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (
    path: string,
    params?: Record<string, any>
  ) => Promise<any>;
  onNavigateToPath: (path: string) => void;
  onStoreGet: (key: string) => Promise<any>;
  onStoreSet: (key: string, value: any) => Promise<void>;
}

const stateStyles = {
  width: "100%",
  padding: "20% 0",
  fontStyle: "italic",
  margin: "0 auto",
  display: "flex",
  justifyContent: "center",
  fontSize: "0.9em",
  color: "#7D7D7E",
};
const DefaultLoadingState = <div style={stateStyles}>Loading...</div>;
const DefaultErrorState = <div style={stateStyles}>Error...</div>;

function mkResponse<T>(
  p: Promise<T>,
  {
    id,
    requestId,
    type,
    origin,
  }: {
    id: string;
    requestId: string;
    type: string;
    origin: string;
  }
) {
  return p
    .then((response) => {
      window.postMessage({ type, id, requestId, response }, origin);
    })
    .catch((e) => {
      // Error is not always serializable
      // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
      const error = e instanceof Error ? e.message : e;
      window.postMessage({ type, id, requestId, error }, origin);
    });
}

export function SandboxedBlock(props: SandboxedBlockProps) {
  const {
    block,
    contents,
    originalContent,
    isEditable,
    tree,
    metadata = {},
    context,
    onUpdateMetadata,
    onUpdateContent,
    onRequestGitHubData,
    onNavigateToPath,
    onStoreGet,
    onStoreSet,
  } = props;
  const { status, data: blockContent } = useBlockContent({
    owner: block.owner,
    repo: block.repo,
    id: block.id,
  });
  const id = useMemo(() => uniqueId("sandboxed-block-"), []);
  const sandpackWrapper = useRef<HTMLDivElement>(null);

  const [sandbox, setSandbox] = React.useState<Window>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data.id === id) {
        const { data, origin, source } = event;

        // handle messages from the sandboxed block
        const originRegex = new RegExp(
          /^https:\/\/\d{1,4}-\d{1,4}-\d{1,4}-sandpack\.codesandbox\.io$/
        );
        if (!source || !originRegex.test(origin)) return;
        const window = source as Window;

        switch (data.type) {
          case "sandbox-ready":
            setSandbox(window);
            break;

          case "update-metadata":
            onUpdateMetadata(data.metadata);
            break;

          case "update-file":
            onUpdateContent(data.content);
            break;

          case "navigate-to-path":
            onNavigateToPath(data.path);
            break;

          case "github-data--request":
            mkResponse(onRequestGitHubData(data.path, data.params), {
              id,
              requestId: data.requestId,
              type: "github-data--response",
              origin,
            });
            break;

          case "store-get--request":
            mkResponse(onStoreGet(data.key), {
              id,
              requestId: data.requestId,
              type: "store-get--response",
              origin,
            });
            break;

          case "store-set--request":
            mkResponse(onStoreSet(data.key, data.value), {
              id,
              requestId: data.requestId,
              type: "store-set--response",
              origin,
            });
            break;
        }
      }
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, []);

  const files = useMemo(() => {
    if (status !== "success") return null;
    if (!blockContent) return null;
    return bundleCodesandboxFiles({
      block,
      bundleCode: blockContent,
      id,
    });
  }, [status, blockContent, block, id]);

  useEffect(() => {
    if (!sandbox) return;

    // the file / folder contents may still be loading
    if (
      (block.type === "file" && !contents) ||
      (block.type === "folder" && !tree)
    )
      return;

    const props = {
      block,
      content: contents,
      originalContent,
      isEditable,
      tree,
      metadata,
      context,
    };
    sandbox.postMessage({ type: "set-props", id, props }, "*");
  }, [
    sandbox,
    block,
    contents,
    originalContent,
    isEditable,
    tree,
    metadata,
    context,
    id,
  ]);

  if (!blockContent) return DefaultLoadingState;
  if (status === "loading") return DefaultLoadingState;
  if (status === "error") return DefaultErrorState;

  return (
    files && (
      <div ref={sandpackWrapper} className="w-full h-full">
        <SandpackProvider
          template="react"
          customSetup={{
            dependencies: {
              "styled-components": "^5.3.3",
              "@primer/react": "^35.2.0",
            },
            files,
          }}
          autorun
        >
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
          />
        </SandpackProvider>
      </div>
    )
  );
}
