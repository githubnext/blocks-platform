import { FileContext } from "@githubnext/utils";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
import { useFileContent, useMetadata } from "hooks";
import React, { useEffect } from "react";
import { ErrorBoundary } from "./error-boundary";
import { UpdateCodeModal } from "./UpdateCodeModal";

interface FileBlockProps {
  theme: string;
  context: FileContext;
  block: Block;
  session: Session;
}

export function FileBlock(props: FileBlockProps) {
  const { context, theme, block, session } = props;
  const { repo, owner, path, sha } = context;
  const [requestedMetadata, setRequestedMetadata] = React.useState(null);

  const { data } = useFileContent({
    repo: repo,
    owner: owner,
    path: path,
    fileRef: sha,
    token: session?.token as string,
  });
  const { name = "", content = "" } = data || {};

  const code = content;

  const blockKey =
    `${block.owner}/${block.repo}__${block.id}`.replace(
      /\//g,
      "__"
    );
  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: block.id && `.github/blocks/file/${blockKey}.json`,
    filePath: path,
    token: session?.token as string,
  });

  useEffect(() => {
    const onUpdateMetadataEvent = (event: MessageEvent) => {
      // TODO: restrict by event.origin
      if (event.data.codesandbox) return;
      if (event.data.type !== "update-metadata") return;
      const newMetadata = event?.data?.metadata || {};
      setRequestedMetadata(newMetadata);
    };
    window.addEventListener("message", onUpdateMetadataEvent as EventListener);
    return () => {
      window.removeEventListener(
        "message",
        onUpdateMetadataEvent as EventListener
      );
    };
  }, [onUpdateMetadata]);

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <SandboxedBlockWrapper
            block={block}
            theme={theme}
            context={{ ...context, file: name }}
            contents={code}
            metadata={metadata}
          />
        </div>
      </ErrorBoundary>

      {!!requestedMetadata && (
        <UpdateCodeModal
          isLoggedIn={!!session?.token}
          path={`.github/blocks/file/${blockKey}.json`}
          newCode={
            JSON.stringify({
              ...metadata,
              [path]: requestedMetadata
            }, null, 2)
          }
          currentCode={JSON.stringify(metadata, null, 2)}
          onSubmit={() => onUpdateMetadata(requestedMetadata)}
          onClose={() => setRequestedMetadata(null)}
        />
      )}
    </div>
  );
}
