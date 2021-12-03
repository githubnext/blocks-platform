import { FileContext, FolderContext } from "@githubnext/utils";
import { SandboxedBlockWrapper } from "components/sandboxed-block-wrapper";
import { getFileContent } from "ghapi";
import { useFileContent, useFolderContent, useMetadata, useUpdateFileContents } from "hooks";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { ErrorBoundary } from "./error-boundary";
import { UpdateCodeModal } from "./UpdateCodeModal";

interface GeneralBlockProps {
  theme: string;
  context: FileContext | FolderContext;
  block: Block;
  session: Session;
  onCommit?: () => void;
}

export function GeneralBlock(props: GeneralBlockProps) {
  const {
    context,
    theme,
    block,
    session,
    onCommit,
  } = props;
  const { repo, owner, path, sha } = context;
  const [requestedMetadata, setRequestedMetadata] = React.useState(null);
  const [requestedMetadataExisting, setRequestedMetadataExisting] = React.useState(null);
  const [requestedMetadataPath, setRequestedMetadataPath] = React.useState(null);
  const [requestedMetadataPathFull, setRequestedMetadataPathFull] = React.useState(null);
  const [requestedFileContent, setRequestedFileContent] = React.useState(null);

  const router = useRouter()
  const query = router.query

  const blockKey = getBlockKey(block)
  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: block.entry && getMetadataPath(block, path),
    filePath: path,
    token: session?.token as string,
  });
  const type = block.type

  const getGitHubData = async (type, config) => {
    const data = await fetchGitHubData(type, { ...config, token: session?.token });
    return data;
  }

  const { mutateAsync } = useUpdateFileContents({})
  const onUpdateContent = async (newContent: string) => {
    await mutateAsync({
      content: newContent,
      owner,
      repo,
      path,
      sha: "latest",
      token: session?.token as string,
    })
    if (onCommit) {
      // for updating the activity feed on changes
      onCommit();
    }
  }

  useEffect(() => {
    const onMessageEvent = async (event: MessageEvent) => {
      // TODO: restrict by event.origin
      if (event.data.codesandbox) return;
      if (event.data.type === "update-metadata") {
        const newMetadata = event?.data?.metadata || {};
        setRequestedMetadata(newMetadata);
        setRequestedMetadataExisting(JSON.stringify(event?.data?.current || "{}", null, 2));
        setRequestedMetadataPath(event?.data?.path);
        setRequestedMetadataPathFull(getMetadataPath(event?.data?.block, event?.data?.path))
      } else if (event.data.type === "navigate-to-path") {
        router.push({
          pathname: event.data.pathname,
          query: { ...query, path: event.data.path },
        })
      } else if (event.data.type === "update-file") {
        setRequestedFileContent(event.data.content);
      } else if (event.data.type === "github-data--request") {
        const data = await getGitHubData(event.data.requestType, event.data.config);
        window.postMessage({
          type: "github-data--response",
          id: event.data.id,
          data,
        }, "*");
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

  const { data: treeData } = useFolderContent(type === "folder" && {
    repo: repo,
    owner: owner,
    path: path,
    fileRef: sha,
    token: session?.token as string,
  });
  const { tree = [] } = treeData || {};

  const { data: fileData } = useFileContent(type === "file" && {
    repo: repo,
    owner: owner,
    path: path,
    fileRef: sha,
    token: session?.token as string,
  });
  const { content = "" } = fileData || {};

  const code = content;

  const name = path.split("/").pop();

  return (
    <div className="flex flex-col" style={{
      height: "calc(100% - 3.3em)"
    }}>
      <ErrorBoundary key={path}>
        <div className="overflow-y-auto flex-1">
          <SandboxedBlockWrapper
            block={block}
            theme={theme}
            context={{ ...context, [type]: name }}
            tree={tree}
            contents={code}
            metadata={metadata}
          />
        </div>
      </ErrorBoundary>
      {!!requestedMetadata && (
        <UpdateCodeModal
          isLoggedIn={!!session?.token}
          path={`.github/blocks/${type}/${blockKey}.json`}
          newCode={JSON.stringify(requestedMetadata, null, 2)}
          currentCode={requestedMetadataExisting || JSON.stringify(metadata, null, 2)}
          onSubmit={() => {
            onUpdateMetadata(requestedMetadata, requestedMetadataPathFull || "")
            setTimeout(() => {
              window.postMessage({
                type: "updated-metadata",
                path: requestedMetadataPath,
              })
            }, 1000)
          }}
          onClose={() => setRequestedMetadata(null)}
        />
      )}
      {!!requestedFileContent && (
        <UpdateCodeModal
          isLoggedIn={!!session?.token}
          path={path}
          newCode={requestedFileContent}
          currentCode={content}
          onSubmit={() => onUpdateContent(requestedFileContent)}
          onClose={() => setRequestedFileContent(null)}
        />
      )}
    </div>
  );
}

const getBlockKey = block => (
  `${block.owner}/${block.repo}__${block.id}`.replace(
    /\//g,
    "__"
  )
)
const getMetadataPath = (block, path) => (
  `.github/blocks/${block.type}/${getBlockKey(block)}/${encodeURIComponent(path)}.json`
)

const fetchGitHubData = async (type, config) => {
  if (type === "file-content") {
    const data = await getFileContent({
      owner: config.owner,
      repo: config.repo,
      path: config.path,
      fileRef: config.fileRef || "HEAD",
      token: config.token,
    })
    return data;
  } else if (type === "metadata") {
    try {
      const res = await getFileContent({
        owner: config.owner,
        repo: config.repo,
        path: getMetadataPath(config.block, config.path),
        fileRef: "HEAD",
        cache: new Date().toString(),
        token: config.token,
      })
      const fullMetadata = JSON.parse((res.content || "{}") as string);
      return fullMetadata || {}
    } catch (e) {
      return {}
    }
  }
}