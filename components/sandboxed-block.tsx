import {
  SandpackProvider,
  SandpackPreview,
} from "@codesandbox/sandpack-react/dist/cjs/index.js";
import { FileContext, FolderContext, RepoFiles } from "@githubnext/utils";
import { bundleCodesandboxFiles } from "../utils/bundle-codesandbox-files";
import uniqueId from "lodash/uniqueId";
import React, { useEffect, useMemo, useRef } from "react";

export interface BundleCode {
  name: string;
  content: string;
}
interface SandboxedBlockProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext;
  renderLoading?: React.ReactNode;
  renderError?: React.ReactNode;
  onUpdateMetadata: (newMetadata: any) => void;
  onRequestUpdateContent: (newContent: string) => void;
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
    tree,
    metadata = {},
    context,
    renderLoading = DefaultLoadingState,
    renderError = DefaultErrorState,
    onUpdateMetadata,
    onRequestUpdateContent,
    onRequestGitHubData,
    onNavigateToPath,
  } = props;
  const state = useFetchZip(block);
  const id = useMemo(() => uniqueId("sandboxed-block-"), []);
  const sandpackWrapper = useRef<HTMLDivElement>(null);

  const status = state.status;
  const blockContent = state.value;

  useEffect(() => {
    const onMessage = (event) => {
      if (event.data.id === id) {
        const { data, origin, source } = event;

        // handle messages from the sandboxed block
        const originRegex = new RegExp(
          /^https:\/\/\d{1,4}-\d{1,4}-\d{1,4}-sandpack\.codesandbox\.io$/
        );
        if (!source || !originRegex.test(origin)) return;
        const window = source as Window;
        if (data.type === "update-metadata") {
          onUpdateMetadata(data.metadata);
        } else if (data.type === "update-file") {
          onRequestUpdateContent(data.content);
        } else if (data.type === "navigate-to-path") {
          onNavigateToPath(data.path);
        } else if (data.type === "github-data--request") {
          onRequestGitHubData(data.path, data.params)
            .then((res) => {
              window.postMessage(
                {
                  type: "github-data--response",
                  id,
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
                  // Error is not always serializable
                  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone
                  error: e instanceof Error ? e.message : e,
                },
                origin
              );
            });
        }
      }
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, []);

  if (!blockContent) return renderLoading as JSX.Element;
  if (status === "loading") return renderLoading as JSX.Element;
  if (status === "error") return renderError as JSX.Element;

  if (!contents && !tree) return null;
  if (status === "success" && blockContent) {
    const files = bundleCodesandboxFiles({
      block,
      bundleCode: blockContent,
      context,
      id,
      contents,
      tree,
      metadata,
    });

    return (
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
    );
  }
  return null;
}

type UseFetchZipResponse = {
  value: BundleCode[] | null;
  status: "loading" | "error" | "success";
};
const useFetchZip = (block: Block): UseFetchZipResponse => {
  if (!block.owner || !block.repo || !block.id) {
    return { value: null, status: "success" };
  }
  const url = `${process.env.NEXT_PUBLIC_MARKETPLACE_URL}/api/get-block-content?owner=${block.owner}&repo=${block.repo}&id=${block.id}`;
  const [state, setState] = React.useState<UseFetchZipResponse>({
    value: null,
    status: "loading",
  });
  const fetchContentForBlock = async () => {
    if (!url) {
      setState({
        status: "error",
        value: null,
      });
      return;
    }
    try {
      const res = await fetch(url);

      const allContent = await res.json();

      setState({
        status: "success",
        value: allContent?.content,
      });
    } catch (error) {
      setState({
        status: "error",
        value: null,
      });
    }
  };
  React.useEffect(() => {
    fetchContentForBlock();
  }, [url]);
  return state;
};
