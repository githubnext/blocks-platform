import {
  SandpackProvider,
  SandpackPreview,
} from "@codesandbox/sandpack-react/dist/cjs/index.js";
import type { FileContext, FolderContext, RepoFiles } from "@githubnext/utils";
import { bundleCodesandboxFiles } from "@githubnext/utils";
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
            onRequestGitHubData(data.path, data.params)
              .then((res) => {
                window.postMessage(
                  {
                    type: "github-data--response",
                    id,
                    requestId: data.requestId,
                    data: res,
                  },
                  origin
                );
              })
              .catch((e) => {
                window.postMessage(
                  {
                    type: "github-data--response",
                    id,
                    requestId: data.requestId,
                    // Error is not always serializable
                    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
                    error: e instanceof Error ? e.message : e,
                  },
                  origin
                );
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
          externalResources={["https://cdn.tailwindcss.com"]}
          template="react"
          customSetup={{
            dependencies: {},
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
