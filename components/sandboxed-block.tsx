import { SandpackRunner } from "@codesandbox/sandpack-react/dist/cjs/index.js";
import { FileContext, FolderContext, RepoFiles } from "@githubnext/utils";
import React from "react";

interface SandboxedBlockProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext
  bundleCode?: string;
  renderLoading?: React.ReactNode;
  renderError?: React.ReactNode;
}

const stateStyles = {
  width: "100%",
  padding: "5em 0",
  margin: "0 auto",
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
  } = props;
  const state = useFetchZip(block.owner, block.repo, block.id);

  const status = state.status
  const blockContent = bundleCode || state.value;

  if (!blockContent) return renderLoading as JSX.Element;
  if (status === "loading") return renderLoading as JSX.Element;
  if (status === "error") return renderError as JSX.Element;

  if (!contents && !tree) return null;

  if (status === "success" && blockContent) {
    const injectedSource = `
      import React from "react";

      ${blockContent}

      const onUpdateMetadata = (newMetadata) => {
        window.parent.postMessage({
          type: "update-metadata",
          context: ${JSON.stringify(context)},
          metadata: newMetadata
        }, "*")
      }
      const Block = BlockBundle.default;

      export default function WrappedBlock() {
        return <Block context={${JSON.stringify(
      context
    )}} content={${JSON.stringify(contents)}} tree={${JSON.stringify(tree)}} metadata={${JSON.stringify(metadata)
      }} onUpdateMetadata={onUpdateMetadata} />
      }
    `;
    return (
      <SandpackRunner
        template="react"
        code={injectedSource}
        customSetup={{
          dependencies: {},
          // files: otherFilesMap,
        }}
        options={{
          showNavigator: false,
        }}
      />
    );
  }
  return null;
}

type UseFetchZipResponse = {
  value: string | null;
  status: "loading" | "error" | "success";
}
const useFetchZip = (blockOwner: string, blockRepo: string, blockId: string): UseFetchZipResponse => {
  if (!blockOwner || !blockRepo || !blockId) {
    return { value: null, status: "success" };
  }
  const url = `https://blocks-marketplace.vercel.app/api/get-block-content?owner=${blockOwner}&repo=${blockRepo}&id=${blockId}`
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
      const scriptFile = allContent.content?.find(f => f.name === `${blockId}/index.js`)

      setState({
        status: "success",
        value: scriptFile?.content || "",
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