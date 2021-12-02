import { RepoContext, RepoFiles } from "ghapi";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
import { useFolderContent, useMetadata } from "hooks";
import React, { useEffect, useMemo } from "react";
import { ErrorBoundary } from "./error-boundary";
import { FolderContext } from "@githubnext/utils";
import { UpdateCodeModal } from "./UpdateCodeModal";
import { useRouter } from "next/router";

interface FolderBlockProps {
  allFiles: RepoFiles;
  theme: string;
  context: FolderContext;
  block: Block;
  session: Session;
}

export function FolderBlock(props: FolderBlockProps) {
  const {
    context,
    theme,
    block,
    allFiles,
    session,
  } = props;
  const { repo, owner, path, sha } = context;
  const [requestedMetadata, setRequestedMetadata] = React.useState(null);
  const router = useRouter()
  const query = router.query

  const blockKey =
    `${block.owner}/${block.repo}__${block.id}`.replace(
      /\//g,
      "__"
    );
  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: block.entry && `.github/blocks/folder/${blockKey}`,
    filePath: path,
    token: session?.token as string,
  });

  useEffect(() => {
    const onMessageEvent = (event: MessageEvent) => {
      // TODO: restrict by event.origin
      if (event.data.codesandbox) return;
      if (event.data.type === "update-metadata") {
        const newMetadata = event?.data?.metadata || {};
        setRequestedMetadata(newMetadata);
      } else if (event.data.type === "navigate-to-path") {
        router.push({
          pathname: event.data.pathname,
          query: { ...query, path: event.data.path },
        })
      }
    };
    window.addEventListener("message", onMessageEvent as EventListener);
    return () => {
      window.removeEventListener(
        "message",
        onMessageEvent as EventListener
      );
    };
  }, [onUpdateMetadata]);

  const { data } = useFolderContent({
    repo: repo,
    owner: owner,
    path: path,
    fileRef: sha,
    token: session?.token as string,
  });
  const { tree = [] } = data || {};

  const name = path.split("/").pop();

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <SandboxedBlockWrapper
            block={block}
            theme={theme}
            context={{ ...context, folder: name }}
            tree={tree}
            metadata={metadata}
            // @ts-ignore
            onUpdateMetadata={setRequestedMetadata}
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
