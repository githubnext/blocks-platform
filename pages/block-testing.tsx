import { FileContext, FolderContext } from "@githubnext/utils"
import { SandboxedBlock } from "components/sandboxed-block"
import { RepoFiles } from "ghapi"
import { useEffect, useState } from "react"

interface BlockTestingProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext
  bundleCode: string;
}

const BlockTesting = ({ }) => {
  const [props, setProps] = useState<BlockTestingProps | null>(null)
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data.type === "block-props") {
        const { block, contents, tree, metadata, context, bundleCode } = event.data

        setProps({ block, contents, tree, metadata, context, bundleCode })
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