import { SandpackRunner } from "@codesandbox/sandpack-react/dist/cjs/index.js";
import { FileContext, FolderContext, RepoFiles } from "@githubnext/utils";
import uniqueId from "lodash/uniqueId";
import React, { useEffect, useRef } from "react";

export interface BundleCode { name: string, content: string }
interface SandboxedBlockProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext
  bundleCode?: BundleCode[];
  renderLoading?: React.ReactNode;
  renderError?: React.ReactNode;
  onRequestUpdateMetadata: (newMetadata: any, path: string, block: Block, currentMetadata: any) => void;
  onRequestUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (type: string, config: any, id: string) => Promise<any>;
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
  color: "#7D7D7E"
}
const DefaultLoadingState = <div style={stateStyles}>Loading...</div>;
const DefaultErrorState = <div style={stateStyles}>Error...</div>;

export function SandboxedBlock(props: SandboxedBlockProps) {
  const {
    block,
    contents,
    tree,
    metadata = {},
    context,
    bundleCode,
    renderLoading = DefaultLoadingState,
    renderError = DefaultErrorState,
    onRequestUpdateMetadata,
    onRequestUpdateContent,
    onRequestGitHubData,
    onNavigateToPath,
  } = props;
  const state = useFetchZip(block);
  const id = useRef(uniqueId("sandboxed-block-"));

  const status = state.status
  const blockContent = bundleCode || state.value;

  useEffect(() => {
    const onMessage = (event) => {
      if (event.data.id === id.current) {
        const { data, origin } = event;
        const originRegex = new RegExp(/^https:\/\/\d{1,4}-\d{1,4}-\d{1,4}-sandpack.codesandbox.io$/)
        if (!originRegex.test(origin)) return;
        if (data.type === "update-metadata") {
          onRequestUpdateMetadata(data.metadata, data.path, data.block, data.currentMetadata);
        } else if (data.type === "update-file") {
          onRequestUpdateContent(data.content);
        } else if (data.type === "navigate-to-path") {
          onNavigateToPath(data.path);
        } else if (data.type === "request-github-data") {
          onRequestGitHubData(data.requestType, data.config, data.id);
        }
      }
    }
    addEventListener("message", onMessage)
    return () => removeEventListener("message", onMessage);
  }, [])

  if (!blockContent) return renderLoading as JSX.Element;
  if (status === "loading") return renderLoading as JSX.Element;
  if (status === "error") return renderError as JSX.Element;

  if (!contents && !tree) return null;
  if (status === "success" && blockContent) {
    const fileName = (block.entry.split("/").pop() || "index.js")
      .replace(".ts", ".js")
      .replace(".jsx", ".js")
    const contentWithUpdatedNames = blockContent.map(({ name, content }) => ({
      name: name.slice(block.id.length + 1),
      content,
    }))
    const scriptFile = contentWithUpdatedNames?.find(f => f.name === fileName)
    const mainContent = scriptFile?.content || ""
    const otherFilesContent = contentWithUpdatedNames.filter(f => f.name !== fileName)

    const cssFiles = otherFilesContent.filter(f => f.name.endsWith(".css"));
    const cssFilesString = cssFiles.map(f => `<style>${f.content}</style>`).join("\n");
    const otherFilesContentProcessed = [{
      name: "/public/index.html",
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom block</title>
  </head>
  <body>
    ${cssFilesString}
    <div id="root"></div>
  </body>
</html>`
    },
    ...otherFilesContent.filter(f => !f.name.endsWith(".css"))]

    let otherFiles = otherFilesContentProcessed.reduce((acc, { name, content }) => {
      acc[name] = content;
      return acc;
    }, {} as any)

    const injectedSource = `
      import React from "react";

      ${processBundle(mainContent)}
      const Block = BlockBundle.default;

      const onUpdateMetadata = (newMetadata) => {
        window.parent.postMessage({
          type: "update-metadata",
          id: "${id.current}",
          context: ${JSON.stringify(context)},
          metadata: newMetadata,
          path: ${JSON.stringify(context.path)},
          block: ${JSON.stringify(block)},
          currentMetadata: ${JSON.stringify(metadata)},
        }, "*")
      }

      const onNavigateToPath = (path) => {
        window.parent.postMessage({
          type: "navigate-to-path",
          id: "${id.current}",
          context: ${JSON.stringify(context)},
          path,
        }, "*")
      }

      export default function WrappedBlock() {

        const onRequestUpdateContent = (content) => {
          window.parent.postMessage({
            type: "update-file",
            id: "${id.current}",
            context: ${JSON.stringify(context)},
            content: content
          }, "*")
        }

        let uniqueId = 0
        const getUniqueId = () => {
          uniqueId++
          return uniqueId
        }

        const onRequestGitHubData = React.useCallback((requestType, config) => {
          // for responses to this specific request
          const requestId = "${uniqueId("github-data--request--")}--" + getUniqueId()
          window.parent.postMessage({
            type: "github-data--request",
            id: "${id.current}",
            context,
            requestId,
            requestType,
            config,
          }, "*")

          return new Promise((resolve, reject) => {
            const onMessage = (event: MessageEvent) => {
              if (event.data.type !== "github-data--response") return
              if (event.data.id !== id) return
              window.removeEventListener("message", onMessage)
              resolve(event.data.data)
            }
            window.addEventListener("message", onMessage)
            const maxDelay = 1000 * 60 * 5
            window.setTimeout(() => {
              window.removeEventListener("message", onMessage)
              reject(new Error("Timeout"))
            }, maxDelay)
          })
        }, [])

        return <Block
          context={${JSON.stringify(
      context
    )}}
          content={${JSON.stringify(contents)}}
          tree={${JSON.stringify(tree)}}
          metadata={${JSON.stringify(metadata)
      }}
          onUpdateMetadata={onUpdateMetadata}
          onNavigateToPath={onNavigateToPath}
          onRequestUpdateContent={onRequestUpdateContent}
          onRequestGitHubData={onRequestGitHubData}
          BlockComponent={BlockComponent}
        />
      }

      const BlockComponent = ({block, path, tree, ...props}) => {
        const [contents, setContents] = React.useState(undefined)
        const [metadata, setMetadata] = React.useState(undefined)

        const getData = async () => {
          if (block.type !== "file") return
          const data = await props.onRequestGitHubData("file-content", {
            owner: props.context.owner,
            repo: props.context.repo,
            path: path,
            fileRef: props.context.fileRef,
          })
          setContents(data.content)
        }
        const getMetadata = async () => {
          if (metadata) return
          const data = await props.onRequestGitHubData("metadata", {
            owner: props.context.owner,
            repo: props.context.repo,
            block: block,
            path: path,
          })
          setMetadata(data)
        }
        React.useEffect(() => { getData() }, [path, block.id])
        React.useEffect(() => { getMetadata() }, [path, block.id])

        React.useEffect(() => {
          // listen for updated metadata
          const onMessageEvent = async (event: MessageEvent) => {
            if (event.data.type === "updated-metadata") {
              getMetadata()
            }
          };
          window.addEventListener("message", onMessageEvent);
          return () => {
            window.removeEventListener(
              "message",
              onMessageEvent
            );
          };
        }, []);

        if (block.type === "file" && !contents) return (
          <div className="p-10">
            Loading...
          </div>
        )
        if (!block.id) return null

        const name = path.split("/").pop();

        return (
          <Block
            block={block}
            theme={"light"}
            context={{ ...props.context, path, file: name, folder: name }}
            contents={contents}
            tree={tree}
            metadata={metadata}
            isEmbedded
          onUpdateMetadata={onUpdateMetadata}
          onNavigateToPath={onNavigateToPath}
          BlockComponent={BlockComponent}
        />
        )
      }
  `;

    return (
      <SandpackRunner
        template="react"
        code={injectedSource}
        customSetup={{
          dependencies: {},
          files: otherFiles,
        }}
        options={{
          showNavigator: false,
        }}
        autorun
      />
    );
  }
  return null;
}


type UseFetchZipResponse = {
  value: BundleCode[] | null;
  status: "loading" | "error" | "success";
}
const useFetchZip = (block: Block): UseFetchZipResponse => {
  if (!block.owner || !block.repo || !block.id) {
    return { value: null, status: "success" };
  }
  const url = `https://blocks-marketplace.vercel.app/api/get-block-content?owner=${block.owner}&repo=${block.repo}&id=${block.id}`
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
      const res = await fetch(url)

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
  }
  React.useEffect(() => { fetchContentForBlock() }, [url]);
  return state;
}

const processBundle = (bundle: string) => {
  // remove imports from React. This might need tweaking
  bundle = bundle.replace(/(import)([\w\s\}\{,]{3,30}?)(from\s["']react["'])/g, "");

  return bundle;
}