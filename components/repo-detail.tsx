import { Box, Button, Link, useTheme } from "@primer/components";
import { FileBlock } from "components/file-block";
import { FolderBlock } from "components/folder-block";
import { useGetBlocksInfo, useMetadata, useRepoFiles, useRepoInfo } from "hooks";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ActivityFeed } from "./ActivityFeed";
import { GitHubHeader } from "./github-header";
import { RepoHeader } from "./repo-header";
import { Sidebar } from "./Sidebar";
import { defaultBlocksRepo } from "blocks/index"

const BlockPicker = dynamic(() => import("./block-picker"), { ssr: false });

interface RepoDetailProps {
  session?: Session;
}

const defaultFileBlock = {
  id: "file-block",
  owner: "githubnext",
  repo: "blocks-examples"
} as Block

const defaultFolderBlock = {
  id: "minimap-block",
  owner: "githubnext",
  repo: "blocks-examples"
} as Block
const getBlockKey = (block: Block) => (
  [block?.owner, block?.repo, block?.id || ""].join("__")
)
const defaultFileBlockKey = getBlockKey(defaultFileBlock)
const defaultFolderBlockKey = getBlockKey(defaultFolderBlock)
export function RepoDetail(props: RepoDetailProps) {
  const { session } = props;
  const router = useRouter();
  const { setColorMode } = useTheme();
  const { blockKey = "" } = router.query;
  const { repo, owner, path = "", theme, fileRef } = router.query;

  // for updating the activity feed on file changes
  const [commitsIteration, setCommitsIteration] = useState(0);

  const context = {
    repo: repo as string,
    owner: owner as string,
    path: path as string,
    sha: fileRef as string || "HEAD"
  };

  useEffect(() => {
    setColorMode(theme === "dark" ? "night" : "day");
  }, [theme]);

  const {
    data: repoInfo,
    status: repoInfoStatus,
    error: repoInfoError,
  } = useRepoInfo({
    repo: repo as string,
    owner: owner as string,
    token: session?.token as string,
  });

  const {
    data: files,
    status: repoFilesStatus,
    error: repoFilesError,
  } = useRepoFiles({
    repo: repo as string,
    owner: owner as string,
    token: session?.token as string,
  });

  const isFolder =
    repoFilesStatus === "success"
      ? files?.find((d) => d.path === path)?.type !== "blob"
      : (path as string).split(".").length > 1


  const onLoadBlock = (block: Block) => {
    if (!block) return;
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        blockKey: getBlockKey(block),
      },
    });
  }

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: `.github/blocks/all.json`,
    filePath: path as string,
    token: session?.token as string,
  });

  let [blockOwner = "githubnext", blockRepo = "blocks-examples", blockId] = (blockKey as string).split("__");
  if (!blockOwner) blockOwner = "githubnext";
  if (!blockRepo) blockRepo = "blocks-examples";

  const { data: allBlocksInfo = [] } = useGetBlocksInfo()
  const isDefaultBlocks = `${blockOwner}/${blockRepo}` === "githubnext/blocks-examples"
  const blocksRepo = isDefaultBlocks ? defaultBlocksRepo : allBlocksInfo.find(block => (
    block.owner === blockOwner && block.repo === blockRepo
  ))
  const blocks = (blocksRepo?.blocks || []).map(block => ({
    ...block,
    owner: blockOwner,
    repo: blockRepo,
  } as Block))
  const extension = (path as string).split(".").slice(-1)[0];
  const relevantBlocks = blocks.filter(
    (d) =>
      d.type === (isFolder ? "folder" : "file") &&
      (!d.extensions || d.extensions?.includes("*") || d.extensions?.includes(extension))
  );
  const defaultBlockKey = metadata[path as string]?.default || (
    getBlockKey(relevantBlocks[1] || relevantBlocks[0])
  )
  const defaultBlock = blocks.find(block => getBlockKey(block) === defaultBlockKey) || relevantBlocks[1]
  blockId = blockId || defaultBlock?.id || (isFolder ? defaultFolderBlock.id : defaultFileBlock.id)

  const block = blocks.find(block => block.id === blockId) || blocks[0] || {} as Block
  const fileInfo = files?.find((d) => d.path === path);
  const size = fileInfo?.size || 0;
  const fileSizeLimit = 1500000; // 1.5Mb
  const isTooLarge = size > fileSizeLimit;

  if (repoFilesStatus === "error" || repoInfoStatus === "error") {
    const error = repoInfoError || repoFilesError;

    return (
      <div className="p-4 pt-40 text-center mx-auto text-red-600">
        Uh oh, something went wrong!
        <p className="max-w-[50em] mx-auto text-sm mt-4 text-gray-600">
          {/* @ts-ignore */}
          {error?.message || ""}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <GitHubHeader session={session} />
      <RepoHeader
        owner={owner as string}
        repo={repo as string}
        // @ts-ignore
        description={repoInfo?.description}
        // @ts-ignore
        contributors={repoInfo?.contributors}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-none w-80 border-r border-gray-200">
          {repoFilesStatus === "loading" ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="animate-pulse flex space-y-4">
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
              </div>
            </div>
          ) : (
            <Sidebar
              owner={owner as string}
              repo={repo as string}
              files={files}
              activeFilePath={path as string}
            />
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex-none top-0 z-10">
            <div>
              <Box
                bg="canvas.subtle"
                p={2}
                borderBottom="1px solid"
                className="!border-gray-200"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box
                  display="flex"
                  alignItems="center"
                >
                  <BlockPicker
                    blocks={relevantBlocks}
                    defaultBlock={defaultBlock}
                    isFolder={isFolder}
                    path={path as string}
                    onChange={onLoadBlock}
                    value={block}
                  />
                  {blockKey !== defaultBlockKey && session?.token && (
                    <Button
                      fontSize="1"
                      ml={2}
                      onClick={() => {
                        const newMetadata = {
                          ...metadata,
                          [path as string]: {
                            ...metadata[path as string],
                            default: blockKey
                          }
                        }
                        onUpdateMetadata(newMetadata)
                      }}
                    >
                      Set as default for all users
                    </Button>
                  )}
                </Box>
                <Link
                  href={`https://github.com/${context.owner}/${context.repo}/${path ? `blob/${context.sha}/${path}` : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="!text-gray-500 mr-3 text-xs"
                >
                  View on GitHub
                </Link>
              </Box>
            </div>
          </div>
          {!!block.id &&
            repoFilesStatus !== "loading" &&
            (isFolder ? (
              <FolderBlock
                key={block.id}
                allFiles={files}
                theme={(theme as string) || "light"}
                context={{
                  folder: "",
                  ...context,
                }}
                block={block}
                session={session}
              />
            ) : isTooLarge ? (
              <div className="italic p-4 pt-40 text-center mx-auto text-gray-600">
                Oh boy, that's a honkin file! It's {size / 1000} KBs.
              </div>
            ) : (
              <FileBlock
                key={block.id}
                context={{
                  file: "",
                  ...context,
                }}
                theme={(theme as string) || "light"}
                block={block}
                session={session}
                onCommit={() => setCommitsIteration(v => v + 1)}
              />
            ))}
        </div>

        <div className="flex-none hidden lg:block w-80 h-full border-l border-gray-200">
          <ActivityFeed
            context={context}
            session={session}
            commitsIteration={commitsIteration}
          />
        </div>
      </div>
    </div>
  );
}
