import { RepoContext } from "ghapi";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
import { useFileContent, useMetadata } from "hooks";
import { getLanguageFromFilename } from "lib";
import React, { useEffect } from "react";
import { ErrorBoundary } from "./error-boundary";
import { FileContext } from "@githubnext/utils";

interface FileBlockProps {
  theme: string;
  blockContext: RepoContext;
  context: FileContext;
  dependencies: Record<string, string>;
  block: Block;
  session: Session;
}

export function FileBlock(props: FileBlockProps) {
  const { context, theme, block, dependencies, session, blockContext } = props;
  const { repo, owner, path, sha } = context;

  const { data } = useFileContent({
    repo: repo,
    owner: owner,
    path: path,
    fileRef: sha,
    token: session.token as string,
  });
  const { name = "", content = "" } = data || {};

  const code = content;

  const blockId =
    `${blockContext.owner}/${blockContext.repo}__${block.entry}`.replace(
      /\//g,
      "__"
    );
  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: block.entry && `.github/blocks/file/${blockId}`,
    filePath: path,
    token: session.token as string,
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
            blockContext={blockContext}
            dependencies={dependencies}
            contents={code}
            metadata={metadata}
            session={session}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
