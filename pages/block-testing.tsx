import { FileContext, FolderContext } from "@githubnext/utils"
import { BundleCode, SandboxedBlock } from "components/sandboxed-block"
import { RepoFiles } from "ghapi"
import { useEffect, useState } from "react"

interface BlockTestingProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext
  bundleCode: BundleCode[];
  onUpdateMetadata: (newMetadata: any, path: string, block: Block, currentMetadata: any) => void;
  onRequestUpdateContent: (newContent: string) => void;
  onRequestGitHubData: (type: string, config: any, id: string) => Promise<any>;
  onNavigateToPath: (path: string) => void;
}

const BlockTesting = ({ }) => {
  const [props, setProps] = useState<BlockTestingProps | null>(null)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data.type === "block-props") {
        const { block, contents, tree, metadata, context,
          onUpdateMetadata, onRequestUpdateContent, onRequestGitHubData, onNavigateToPath,
          bundleCode } = event.data

        setProps({
          block, contents, tree, metadata, context,
          onUpdateMetadata, onRequestUpdateContent, onRequestGitHubData, onNavigateToPath, bundleCode
        })
      } else {
        // pass messages up to parent of iframe (eg. to update metadata)
        window.parent.postMessage(event.data, "*")
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  if (!props) return (
    <div className="w-full text-center py-16 italic text-gray-500">
      Waiting for props...
    </div>
  )
  return (
    <div className="sandbox-wrapper h-full w-full">
      <SandboxedBlock {...props} />
    </div>
  )
}

export default BlockTesting