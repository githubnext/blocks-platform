import { FileContext } from "@githubnext/utils";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
import { useFileContent, useMetadata } from "hooks";
import React, { useEffect } from "react";
import { ErrorBoundary } from "./error-boundary";

interface FileBlockProps {
  theme: string;
  context: FileContext;
  block: Block;
  session: Session;
}

export function FileBlock(props: FileBlockProps) {
  const { context, theme, block, session } = props;
  const { repo, owner, path, sha } = context;

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
    metadataPath: block.id && `.github/blocks/file/${blockKey}`,
    filePath: path,
    token: session?.token as string,
  });

  useEffect(() => {
    const onUpdateMetadataEvent = (event: MessageEvent) => {
      // TODO: restrict by event.origin
      if (event.data.codesandbox) return;
      if (event.data.type !== "update-metadata") return;
      const newMetadata = event?.data?.metadata || {};
      onUpdateMetadata(newMetadata);
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
    </div>
  );
}