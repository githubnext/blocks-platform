import { Box, Button, Link, TextInput, useTheme } from "@primer/react";
import { default as NextLink } from "next/link";
import {
  getBlockKey,
  useGetBranches,
  useManageBlock,
  useMetadata,
  useRepoFiles,
  useRepoInfo,
} from "hooks";
import type { Branch } from "ghapi";
import type { QueryStatus } from "react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo, useRef } from "react";
import { ActivityFeed } from "./ActivityFeed";
import { GitHubHeader } from "./github-header";
import { RepoHeader } from "./repo-header";
import { Sidebar } from "./Sidebar";
import { GeneralBlock } from "./general-block";
import { UpdateCodeModal } from "./UpdateCodeModal";
import type { RepoFiles } from "@githubnext/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  PlusIcon,
  ScreenFullIcon,
  ScreenNormalIcon,
} from "@primer/octicons-react";

const BlockPicker = dynamic(() => import("./block-picker"), { ssr: false });

type Context = { repo: string; owner: string; path: string; sha: string };

type HeaderProps = {
  isFullscreen: boolean;
  owner: string;
  repo: string;
  description?: string;
  contributors?: any[];
  branchName: string;
  branches?: Branch[];
  onChangeBranch: (branchName: string) => void;
};

function Header({
  isFullscreen,
  owner,
  repo,
  description,
  contributors,
  branchName,
  branches,
  onChangeBranch,
}: HeaderProps) {
  return (
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
            <GitHubHeader />
            <RepoHeader
              owner={owner}
              repo={repo}
              description={description}
              contributors={contributors}
              branchName={branchName}
              branches={branches || []}
              onChangeBranch={onChangeBranch}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type FileTreePaneProps = {
  isFullscreen: boolean;
  repoFilesStatus: QueryStatus;
  owner: string;
  repo: string;
  files?: RepoFiles;
  path: string;
};

function FileTreePane({
  isFullscreen,
  repoFilesStatus,
  owner,
  repo,
  files,
  path,
}: FileTreePaneProps) {
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const [isAddingNewFile, setIsAddingNewFile] = useState<
    undefined | { block: Block; path: string; name: string }
  >(undefined);
  useEffect(() => {
    if (isAddingNewFile && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [isAddingNewFile]);

  return (
    <AnimatePresence initial={false}>
      {!isFullscreen && (
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: "17rem",
            transition: { type: "tween", duration: 0.1 },
          }}
          exit={{ width: 0, transition: { type: "tween", duration: 0.1 } }}
          className="flex-none w-[17rem] border-r border-gray-200"
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
            <Box>
              <Box
                bg="canvas.subtle"
                p={2}
                borderBottom="1px solid"
                borderColor="border.muted"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <BlockPicker
                  button={
                    <>
                      <PlusIcon /> New File
                    </>
                  }
                  type={"file"}
                  onChange={(block) =>
                    // TODO(jaked) if selected path is a file, `path` should be the parent folder
                    setIsAddingNewFile({ block, path, name: "" })
                  }
                />
              </Box>
              <Sidebar
                owner={owner}
                repo={repo}
                files={files}
                activeFilePath={path}
                componentAtPath={
                  isAddingNewFile
                    ? {
                        component: (
                          <TextInput
                            ref={newFileInputRef}
                            block={true}
                            value={isAddingNewFile.name}
                            onChange={(e) =>
                              setIsAddingNewFile({
                                ...isAddingNewFile,
                                name: e.target.value,
                              })
                            }
                            onBlur={() => {
                              setIsAddingNewFile(undefined);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setIsAddingNewFile(undefined);
                              } else if (e.key === "Escape") {
                                setIsAddingNewFile(undefined);
                              }
                            }}
                          />
                        ),
                        path: isAddingNewFile.path,
                      }
                    : undefined
                }
              />
            </Box>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type BlockPaneProps = {
  path: string;
  isFolder: boolean;
  setBlock: (block: Block) => void;
  block: Block;
  isDefaultBlock: boolean;
  token: string;
  metadata: any;
  blockKey: string;
  setRequestedMetadata: (metadata: any) => void;
  isFullscreen: boolean;
  context: Context;
  size: number;
  isTooLarge: boolean;
  theme: string;
  repoFilesStatus: QueryStatus;
  branchName: string;
};

function BlockPane({
  path,
  isFolder,
  setBlock,
  block,
  isDefaultBlock,
  token,
  metadata,
  blockKey,
  setRequestedMetadata,
  isFullscreen,
  context,
  size,
  isTooLarge,
  theme,
  repoFilesStatus,
  branchName,
}: BlockPaneProps) {
  const router = useRouter();
  return (
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
                path={path}
                type={isFolder ? "folder" : "file"}
                onChange={setBlock}
                value={block}
              />
              {!isDefaultBlock && token && (
                <Button
                  onClick={() => {
                    const newMetadata = {
                      ...metadata,
                      [path]: {
                        ...metadata[path],
                        default: blockKey,
                      },
                    };
                    setRequestedMetadata(newMetadata);
                  }}
                >
                  Set as default for all users
                </Button>
              )}
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
      {(() => {
        if (!(block.id && repoFilesStatus !== "loading")) return null;

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
            theme={theme || "light"}
            block={block}
            token={token}
            branchName={branchName}
          />
        );
      })()}
    </div>
  );
}

type CommitsPaneProps = {
  isFullscreen: boolean;
  context: Context;
  branchName: string;
};

function CommitsPane({ isFullscreen, context, branchName }: CommitsPaneProps) {
  return (
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
          <ActivityFeed context={context} branchName={branchName} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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
    branch: branchName,
  } = router.query as Record<string, string>;
  const [requestedMetadata, setRequestedMetadata] = useState(null);
  const isFullscreen = mode === "fullscreen";
  // need this to only animate chrome in on fullscreen mode change, but not on load

  const { data: branches } = useGetBranches({ owner, repo });
  const branch = useMemo(
    () => branches?.find((b) => b.name === branchName),
    [branches, branchName]
  );

  const context = useMemo(
    () => ({
      repo,
      owner,
      path,
      sha: fileRef || "HEAD",
    }),
    [repo, owner, path, fileRef]
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
  } = useRepoInfo({ repo, owner });

  const {
    data: files,
    status: repoFilesStatus,
    error: repoFilesError,
  } = useRepoFiles({
    repo,
    owner,
    sha: branchName || branch?.name,
  });

  const isFolder =
    repoFilesStatus === "success"
      ? files?.find((d) => d.path === path)?.type !== "blob"
      : !path.includes("."); // if there's an extension it's a file

  const { metadata, onUpdateMetadata } = useMetadata({
    owner,
    repo,
    metadataPath: `.github/blocks/all.json`,
    filePath: path,
    token,
    branchName: branch?.name,
  });

  const {
    block: rawBlock,
    setBlock,
    defaultBlock,
  } = useManageBlock({
    path,
    storedDefaultBlock: metadata[path]?.default,
    isFolder,
  });

  useEffect(() => {
    if (defaultBlock) {
      setBlock(defaultBlock);
    }
  }, [getBlockKey(defaultBlock), path]);

  const block = useMemo(
    () => rawBlock,
    [rawBlock.owner, rawBlock.repo, rawBlock.id]
  );
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
      <Header
        isFullscreen={isFullscreen}
        owner={owner}
        repo={repo}
        description={repoInfo?.description}
        // @ts-ignore
        contributors={repoInfo?.contributors}
        branchName={branchName}
        branches={branches}
        onChangeBranch={setBranchName}
      />

      <div className="flex flex-1 overflow-hidden">
        <FileTreePane
          {...{
            isFullscreen,
            repoFilesStatus,
            owner,
            repo,
            files,
            path,
          }}
        />

        <BlockPane
          {...{
            path,
            isFolder,
            setBlock,
            block,
            isDefaultBlock,
            token,
            metadata,
            blockKey,
            setRequestedMetadata,
            isFullscreen,
            context,
            size,
            isTooLarge,
            theme,
            repoFilesStatus,
            branchName,
          }}
        />

        <CommitsPane
          isFullscreen={isFullscreen}
          context={context}
          branchName={branchName || branch?.name}
        />
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
