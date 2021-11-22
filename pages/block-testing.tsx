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
      if (event.data.type !== "block-props") return
      const { block, contents, tree, metadata, context, bundleCode } = event.data
      console.log(block, contents, tree, metadata, context, bundleCode)

      setProps({ block, contents, tree, metadata, context, bundleCode })
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  if (!props) return null
  return (
    <SandboxedBlock {...props} />
  )
}

export default BlockTesting