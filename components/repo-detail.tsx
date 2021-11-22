import { Box, useTheme } from "@primer/components";
import { FileBlock } from "components/file-block";
import { FolderBlock } from "components/folder-block";
import { useGetBlocksInfo, useMetadata, useRepoFiles, useRepoInfo } from "hooks";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { ActivityFeed } from "./ActivityFeed";
import { GitHubHeader } from "./github-header";
import { RepoHeader } from "./repo-header";
import { Sidebar } from "./Sidebar";


const BlockPicker = dynamic(() => import("./block-picker"), { ssr: false });

interface RepoDetailProps {
  session: Session;
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
export function RepoDetail(props: RepoDetailProps) {
  const { session } = props;
  const router = useRouter();
  const { setColorMode } = useTheme();
  const { blockKey = defaultFileBlockKey } = router.query;
  const { repo, owner, path = "", theme, fileRef } = router.query;

  const context = {
    repo: repo as string,
    owner: owner as string,
    path: path as string,
    sha: fileRef as string,
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
    token: session.token as string,
  });

  const {
    data: files,
    status: repoFilesStatus,
    error: repoFilesError,
  } = useRepoFiles({
    repo: repo as string,
    owner: owner as string,
    token: session.token as string,
  });

  const isFolder =
    repoFilesStatus === "success"
      ? files?.find((d) => d.path === path)?.type !== "blob"
      : null;

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
    metadataPath: `.github/blocks/all`,
    filePath: path as string,
    token: session.token as string,
  });

  const [blockOwner = "githubnext", blockRepo = "blocks-examples", blockId] = (blockKey as string).split("__");

  const { data: allBlocksInfo = [] } = useGetBlocksInfo()
  const blocksRepo = allBlocksInfo.find(block => (
    block.owner === blockOwner && block.repo === blockRepo
  ))
  const blocks = (blocksRepo?.blocks || []).map(block => ({
    ...block,
    owner: blockOwner,
    repo: blockRepo,
  } as Block))

  const block = blocks.find(block => block.id === blockId) || blocksRepo?.blocks[0] || {} as Block
  const fileInfo = files?.find((d) => d.path === path);
  const size = fileInfo?.size || 0;
  const fileSizeLimit = 100000; // 200KB
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
              >
                <BlockPicker
                  blocks={blocks.filter(
                    (d) => d.type === (isFolder ? "folder" : "file")
                  )}
                  isFolder={isFolder}
                  path={path as string}
                  onChange={onLoadBlock}
                  value={block}
                />
                {/* {blockType !== defaultBlock && (
              <Button
                fontSize="1"
                ml={2}
                onClick={() => onSetDefaultBlock(blockType)}
              >
                Set as default for all users
              </Button>
            )} */}
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
              />
            ))}
        </div>

        <div className="flex-none hidden lg:block w-80 h-full border-l border-gray-200">
          <ActivityFeed
            context={context}
            session={session}
          />
        </div>
      </div>
    </div>
  );
}
