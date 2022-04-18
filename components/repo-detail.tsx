import { Box, Button, Link, useTheme } from "@primer/react";
import { default as NextLink } from "next/link";
import {
  getBlockKey,
  useGetBranches,
  useManageBlock,
  useMetadata,
  useRepoFiles,
  useRepoInfo,
  useRepoTimeline,
} from "hooks";
import type { UseManageBlockResult } from "hooks";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import { FullPageLoader } from "./full-page-loader";
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
  contributors: Contributor[];
  branch: string;
  branches: Branch[];
  onChangeBranch: (branch: string) => void;
};

function Header({
  isFullscreen,
  owner,
  repo,
  description,
  contributors,
  branch,
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
              branch={branch}
              branches={branches}
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
  owner: string;
  repo: string;
  files: undefined | RepoFiles;
  path: string;
};

function FileTreePane({
  isFullscreen,
  owner,
  repo,
  files,
  path,
}: FileTreePaneProps) {
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
          {files && (
            <Sidebar
              owner={owner}
              repo={repo}
              files={files}
              activeFilePath={path}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type BlockPaneHeaderProps = {
  manageBlockResult: UseManageBlockResult;
  isFullscreen: boolean;
  path: string;
  isFolder: boolean;
  token: string;
  metadata: any;
  setRequestedMetadata: (metadata: any) => void;
  context: Context;
};

function BlockPaneHeader({
  manageBlockResult,
  isFullscreen,
  path,
  isFolder,
  token,
  metadata,
  setRequestedMetadata,
  context,
}: BlockPaneHeaderProps) {
  const router = useRouter();

  const { block, setBlock, defaultBlock } = manageBlockResult.data ?? {};
  const isDefaultBlock = getBlockKey(block) === getBlockKey(defaultBlock);

  return (
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
                      default: getBlockKey(block),
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
  );
}

type BlockPaneProps = {
  fileInfo: RepoFiles[0];
  path: string;
  timeline: undefined | RepoTimeline;
  token: string;
  metadata: any;
  setRequestedMetadata: (metadata: any) => void;
  isFullscreen: boolean;
  context: Context;
  theme: string;
  branch: string;
};

function BlockPane({
  fileInfo,
  path,
  timeline,
  token,
  metadata,
  setRequestedMetadata,
  isFullscreen,
  context,
  theme,
  branch,
}: BlockPaneProps) {
  const router = useRouter();

  const isFolder = fileInfo.type !== "blob";

  const manageBlockResult = useManageBlock({
    path,
    storedDefaultBlock: metadata[path]?.default,
    isFolder,
  });

  useEffect(() => {
    if (manageBlockResult.data) {
      const blockKey = getBlockKey(manageBlockResult.data.block);
      if (router.query.blockKey !== blockKey) {
        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...router.query,
              blockKey: blockKey,
            },
          },
          undefined,
          { shallow: true }
        );
      }
    }
  });

  return (
    <div className="flex-1 overflow-hidden">
      <BlockPaneHeader
        {...{
          manageBlockResult,
          isFullscreen,
          path,
          isFolder,
          token,
          metadata,
          setRequestedMetadata,
          context,
        }}
      />
      {(() => {
        if (!manageBlockResult.data) return null;
        const block = manageBlockResult.data.block;

        const size = fileInfo.size || 0;
        const fileSizeLimit = 1500000; // 1.5Mb
        const isTooLarge = size > fileSizeLimit;

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
            timeline={timeline}
            block={block}
            token={token}
            branch={branch}
          />
        );
      })()}
    </div>
  );
}

type CommitsPaneProps = {
  isFullscreen: boolean;
  context: Context;
  timeline: undefined | RepoTimeline;
};

function CommitsPane({ isFullscreen, context, timeline }: CommitsPaneProps) {
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
          <ActivityFeed context={context} timeline={timeline} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface RepoDetailInnerProps {
  token: string;
  repoInfo: RepoInfo;
  branches: Branch[];
  branch: string;
  files: undefined | RepoFiles;
  timeline: undefined | RepoTimeline;
}

export function RepoDetailInner(props: RepoDetailInnerProps) {
  const { token, repoInfo, branches, branch, files, timeline } = props;
  const router = useRouter();
  const { setColorMode } = useTheme();
  const {
    repo,
    owner,
    path = "",
    theme,
    fileRef,
    mode,
  } = router.query as Record<string, string>;
  const [requestedMetadata, setRequestedMetadata] = useState(null);
  const isFullscreen = mode === "fullscreen";
  // need this to only animate chrome in on fullscreen mode change, but not on load

  const context = useMemo(
    () => ({
      repo,
      owner,
      path,
      sha: fileRef || branch,
    }),
    [repo, owner, path, fileRef]
  );

  const fileInfo = files && files.find((d) => d.path === path);

  const setBranch = (branch: string) => {
    const query = { ...router.query, branch };
    // clear cached sha and default to latest on branch
    delete query["fileRef"];
    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      {
        shallow: true,
      }
    );
  };

  useEffect(() => {
    setColorMode(theme === "dark" ? "night" : "day");
  }, [theme]);

  const { metadata, onUpdateMetadata } = useMetadata({
    owner,
    repo,
    metadataPath: `.github/blocks/all.json`,
    filePath: path,
    token,
    branch,
  });

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <Header
        isFullscreen={isFullscreen}
        owner={owner}
        repo={repo}
        description={repoInfo.description}
        contributors={repoInfo.contributors}
        branch={branch}
        branches={branches}
        onChangeBranch={setBranch}
      />

      <div className="flex flex-1 overflow-hidden">
        <FileTreePane
          {...{
            isFullscreen,
            owner,
            repo,
            files,
            path,
          }}
        />

        {undefined ? (
          <BlockPane
            {...{
              fileInfo,
              path,
              timeline,
              token,
              metadata,
              setRequestedMetadata,
              isFullscreen,
              context,
              theme,
              branch,
            }}
          />
        ) : (
          <div className="flex-1" />
        )}

        <CommitsPane
          isFullscreen={isFullscreen}
          context={context}
          timeline={timeline}
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

interface RepoDetailProps {
  token: string;
}

export function RepoDetail({ token }: RepoDetailProps) {
  const router = useRouter();
  const {
    repo,
    owner,
    branch: branchParam,
    path = "",
  } = router.query as Record<string, string>;

  const repoInfo = useRepoInfo({ repo, owner });
  const branches = useGetBranches({ repo, owner });

  let branch: string | undefined = undefined;
  if (repoInfo.data && branches.data) {
    if (branchParam && branches.data.some((b) => b.name === branchParam)) {
      branch = branchParam;
    } else {
      branch = repoInfo.data.default_branch;
    }
  }

  useEffect(() => {
    if (branch) {
      if (branchParam !== branch) {
        const query = { ...router.query, branch };
        // clear cached sha and default to latest on branch
        delete query["fileRef"];
        router.push(
          {
            pathname: router.pathname,
            query,
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [branch]);

  const repoFiles = useRepoFiles(
    {
      repo,
      owner,
      sha: branch,
    },
    { enabled: Boolean(branch) }
  );

  const repoTimeline = useRepoTimeline(
    {
      repo,
      owner,
      path,
      sha: branch,
    },
    { enabled: Boolean(branch) }
  );

  const queries = [repoInfo, branches, repoFiles, repoTimeline];

  if (queries.some((res) => res.status === "error")) {
    const error = queries.find((res) => res.error)?.error;
    return (
      <div className="p-4 pt-40 text-center mx-auto text-red-600">
        Uh oh, something went wrong!
        <p className="max-w-[50em] mx-auto text-sm mt-4 text-gray-600">
          {error?.message}
        </p>
      </div>
    );
  } else if (repoInfo.status === "success" && branches.status === "success") {
    return (
      <RepoDetailInner
        token={token}
        repoInfo={repoInfo.data}
        branches={branches.data}
        branch={branch}
        files={repoFiles.data}
        timeline={repoTimeline.data}
      />
    );
  } else if (queries.some((res) => res.status === "error")) {
    const error = queries.find((res) => res.error)?.error;
    return (
      <div className="p-4 pt-40 text-center mx-auto text-red-600">
        Uh oh, something went wrong!
        <p className="max-w-[50em] mx-auto text-sm mt-4 text-gray-600">
          {error?.message}
        </p>
      </div>
    );
  } else {
    return <FullPageLoader />;
  }
}
