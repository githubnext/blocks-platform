import { Box, Button, Link, useTheme } from "@primer/react";
import { default as NextLink } from "next/link";
import {
  getBlockKey,
  useGetBranches,
  useManageBlock,
  useMetadata,
  useRepoFiles,
  useRepoInfo,
} from "hooks";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import { ActivityFeed } from "./ActivityFeed";
import { GitHubHeader } from "./github-header";
import { RepoHeader } from "./repo-header";
import { Sidebar } from "./Sidebar";
import { GeneralBlock } from "./general-block";
import { CustomBlockPicker } from "./custom-block-picker";
import { UpdateCodeModal } from "./UpdateCodeModal";
import { FileContext, FolderContext } from "@githubnext/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ScreenFullIcon, ScreenNormalIcon } from "@primer/octicons-react";
import BranchPicker from "./branch-picker";

const BlockPicker = dynamic(() => import("./block-picker"), { ssr: false });

interface RepoDetailProps {
  token: string;
}

export function RepoDetail(props: RepoDetailProps) {
  const { token } = props;
  const router = useRouter();
  const { setColorMode } = useTheme();
  const {
    repo,
    owner,
    path = "",
    theme,
    fileRef,
    mode,
    branch: branchName = "main",
  } = router.query;
  const [isChoosingCustomBlock, setIsChoosingCustomBlock] = useState(false);
  const [requestedMetadata, setRequestedMetadata] = useState(null);
  const isFullscreen = mode === "fullscreen";
  // need this to only animate chrome in on fullscreen mode change, but not on load

  const { data: branches } = useGetBranches({
    owner: owner as string,
    repo: repo as string,
    token,
  });
  const branch = useMemo(
    () => branches?.find((b) => b.name === branchName),
    [branches, branchName]
  );

  const context = useMemo(
    () => ({
      repo: repo as string,
      owner: owner as string,
      path: path as string,
      sha: (fileRef as string) || branch?.commit?.sha || "HEAD",
    }),
    [repo, owner, path, fileRef || branch?.commit?.sha]
  );

  const setBranchName = (branchName: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          branch: branchName,
          // clear cached sha and default to latest on branch
          fileRef: undefined,
        },
      },
      undefined,
      { shallow: true }
    );
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
    token,
  });

  const {
    data: files,
    status: repoFilesStatus,
    error: repoFilesError,
  } = useRepoFiles({
    repo: repo as string,
    owner: owner as string,
    token,
  });

  const isFolder =
    repoFilesStatus === "success"
      ? files?.find((d) => d.path === path)?.type !== "blob"
      : !(path as string).includes("."); // if there's an extension it's a file

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: `.github/blocks/all.json`,
    filePath: path as string,
    token,
  });

  const {
    block: rawBlock,
    setBlock,
    blockOptions,
    defaultBlock,
    allBlocksInfo,
  } = useManageBlock({
    path: path as string,
    storedDefaultBlock: metadata[path as string]?.default,
    isFolder,
  });

  const block = useMemo(
    () => rawBlock,
    [rawBlock.owner, rawBlock.repo, rawBlock.id]
  );
  const setBlockLocal = (block: Block) => {
    setIsChoosingCustomBlock(false);
    setBlock(block);
  };
  const blockKey = getBlockKey(block);
  const defaultBlockKey = getBlockKey(defaultBlock);
  const isDefaultBlock = defaultBlockKey === blockKey;

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
      <AnimatePresence initial={false}>
        {!isFullscreen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{
              height: "auto",
              transition: {
                type: "tween",
                duration: 0.1,
                delay: 0,
              },
            }}
            exit={{
              height: 0,
              transition: { type: "tween", duration: 0.1, delay: 0 },
            }}
          >
            {/* to prevent the search bar from showing on top of other content while animating */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: {
                  type: "tween",
                  duration: 0,
                  delay: 0,
                },
              }}
              exit={{
                opacity: 0,
                transition: { type: "tween", duration: 0, delay: 0.1 },
              }}
            >
              <GitHubHeader token={token} />
              <RepoHeader
                owner={owner as string}
                repo={repo as string}
                // @ts-ignore
                description={repoInfo?.description}
                // @ts-ignore
                contributors={repoInfo?.contributors}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {!isFullscreen && (
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: "auto",
                transition: { type: "tween", duration: 0.1 },
              }}
              exit={{ width: 0, transition: { type: "tween", duration: 0.1 } }}
              className="flex-none w-80 border-r border-gray-200"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-hidden">
          <div className="flex-none top-0 z-10">
            <div>
              <Box
                bg="canvas.subtle"
                p={2}
                borderBottom="1px solid"
                borderColor="border.muted"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" className="space-x-2">
                  <BlockPicker
                    blocks={blockOptions}
                    defaultBlock={defaultBlock}
                    path={path as string}
                    onChange={setBlockLocal}
                    value={block}
                    isChoosingCustomBlock={isChoosingCustomBlock}
                    setIsChoosingCustomBlock={setIsChoosingCustomBlock}
                  />
                  {!isDefaultBlock && token && (
                    <Button
                      onClick={() => {
                        const newMetadata = {
                          ...metadata,
                          [path as string]: {
                            ...metadata[path as string],
                            default: blockKey,
                          },
                        };
                        setRequestedMetadata(newMetadata);
                      }}
                    >
                      Set as default for all users
                    </Button>
                  )}
                  <BranchPicker
                    value={branchName}
                    branches={branches || []}
                    onChange={setBranchName}
                  />
                </Box>
                <AnimatePresence initial={false}>
                  {isFullscreen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          type: "tween",
                          duration: 0.1,
                          delay: 0.2,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        y: 5,
                        transition: {
                          type: "tween",
                          duration: 0.1,
                          delay: 0.2,
                        },
                      }}
                    >
                      <Box className="text-sm text-gray-500 ml-2">
                        {context.owner}/{context.repo}: {path}
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Link
                  href={`https://github.com/${context.owner}/${context.repo}/${
                    path ? `blob/${context.sha}/${path}` : ""
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="!text-gray-500 mr-3 ml-auto text-xs"
                >
                  View on GitHub
                </Link>
                <NextLink
                  shallow
                  href={{
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      mode: isFullscreen ? undefined : "fullscreen",
                    },
                  }}
                >
                  <span
                    className="text-gray-500 text-xs ml-2 mr-3 cursor-pointer"
                    title={isFullscreen ? "Exit fullscreen" : "Make fullscreen"}
                  >
                    {isFullscreen ? <ScreenNormalIcon /> : <ScreenFullIcon />}
                  </span>
                </NextLink>
              </Box>
            </div>
          </div>
          <BlockRender
            {...{
              isChoosingCustomBlock,
              allBlocksInfo,
              setBlockLocal,
              isFolder,
              size,
              isTooLarge,
              theme,
              block,
              token,
            }}
            // @ts-ignore
            context={context}
            path={path as string}
            isLoaded={!!block.id && repoFilesStatus !== "loading"}
          />
        </div>

        <AnimatePresence initial={false}>
          {!isFullscreen && (
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: "auto",
                transition: { type: "tween", duration: 0.1 },
              }}
              exit={{ width: 0, transition: { type: "tween", duration: 0.1 } }}
              className="flex-none hidden lg:block h-full border-l border-gray-200"
            >
              <ActivityFeed context={context} token={token} branch={branch} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!!requestedMetadata && (
        <UpdateCodeModal
          isLoggedIn={!!token}
          path={`.github/blocks/all.json`}
          newCode={JSON.stringify(requestedMetadata, null, 2)}
          currentCode={JSON.stringify(metadata, null, 2)}
          onSubmit={() => {
            onUpdateMetadata(requestedMetadata, `.github/blocks/all.json`);
          }}
          onClose={() => setRequestedMetadata(null)}
        />
      )}
    </div>
  );
}

function BlockRender({
  isChoosingCustomBlock,
  allBlocksInfo,
  setBlockLocal,
  path,
  isFolder,
  isLoaded,
  size,
  isTooLarge,
  context,
  theme,
  block,
  token,
}: {
  isChoosingCustomBlock: boolean;
  allBlocksInfo: Block[];
  setBlockLocal: (block: Block) => void;
  path: string;
  isFolder: boolean;
  isLoaded: boolean;
  size: number;
  isTooLarge: boolean;
  context: FileContext | FolderContext;
  theme: string;
  block: Block;
  token: string;
}) {
  if (isChoosingCustomBlock)
    return (
      <CustomBlockPicker
        allBlocks={allBlocksInfo}
        onChange={setBlockLocal}
        path={path as string}
        isFolder={isFolder}
      />
    );
  if (!isLoaded) return null;
  if (isTooLarge)
    return (
      <div className="italic p-4 pt-40 text-center mx-auto text-gray-600">
        Oh boy, that's a honkin file! It's {size / 1000} KBs.
      </div>
    );
  return (
    <GeneralBlock
      key={block.id}
      // @ts-ignore
      context={context}
      theme={(theme as string) || "light"}
      block={block}
      token={token}
    />
  );
}
