import * as Immer from "immer";
import {
  Box,
  Button,
  Flash,
  Link,
  StyledOcticon,
  useTheme,
} from "@primer/react";
import { default as NextLink } from "next/link";
import {
  getBlockKey,
  useCallbackWithProps,
  useFileContent,
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
import { useEffect, useState, useMemo, useContext } from "react";
import { FullPageLoader } from "./full-page-loader";
import { ActivityFeed } from "./ActivityFeed";
import { GitHubHeader } from "./github-header";
import { RepoHeader } from "./repo-header";
import { Sidebar } from "./Sidebar";
import { GeneralBlock } from "./general-block";
import { UpdateCodeModal } from "./UpdateCodeModal";
import { CommitCodeDialog } from "./commit-code-dialog";
import type { RepoFiles } from "@githubnext/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  RepoPushIcon,
  ScreenFullIcon,
  ScreenNormalIcon,
  AlertIcon,
} from "@primer/octicons-react";
import { AppContext } from "context";
import { useSession } from "next-auth/react";
import { CODEX_BLOCKS } from "lib";

const BlockPicker = dynamic(() => import("./block-picker"), { ssr: false });

type Context = { repo: string; owner: string; path: string; sha: string };

type UpdatedContent = {
  sha: string;
  original: string;
  content: string;
};
type UpdatedContents = Record<string, UpdatedContent>;

type HeaderProps = {
  isFullscreen: boolean;
  owner: string;
  repo: string;
  description?: string;
  contributors: Contributor[];
  branchName: string;
  branches: Branch[];
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
  updatedContents: UpdatedContents;
};

function FileTreePane({
  isFullscreen,
  owner,
  repo,
  files,
  path,
  updatedContents,
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
          {!files ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="animate-pulse flex space-y-4">
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
              </div>
            </div>
          ) : (
            <Sidebar
              owner={owner}
              repo={repo}
              files={files}
              updatedContents={updatedContents}
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
  onSaveChanges: () => void;
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
  onSaveChanges,
}: BlockPaneHeaderProps) {
  const router = useRouter();
  const appContext = useContext(AppContext);

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
            <Button
              key={"Save"}
              variant={"primary"}
              leadingIcon={RepoPushIcon}
              disabled={!onSaveChanges || !appContext.hasRepoInstallation}
              onClick={onSaveChanges}
            >
              Save
            </Button>
            <BlockPicker
              path={path}
              type={isFolder ? "folder" : "file"}
              onChange={setBlock}
              value={block}
            />
            {!isDefaultBlock && token && (
              <Button
                disabled={!appContext.hasRepoInstallation}
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
                Make default
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

type BlockPaneBlockProps = {
  token: string;
  block: Block;
  fileInfo: RepoFiles[0];
  path: string;
  context: Context;
  isFolder: boolean;
  theme: string;
  branchName: string;
  updatedContents: UpdatedContents;
  setUpdatedContents: (_: UpdatedContents) => void;
};

function BlockPaneBlock({
  token,
  block,
  fileInfo,
  path,
  context,
  isFolder,
  theme,
  branchName,
  updatedContents,
  setUpdatedContents,
}: BlockPaneBlockProps) {
  const size = fileInfo.size || 0;
  const fileSizeLimit = 1500000; // 1.5Mb
  const isTooLarge = size > fileSizeLimit;

  const showUpdatedContents =
    updatedContents[path] && context.sha === branchName;

  const { data: fileData } = useFileContent(
    {
      repo: context.repo,
      owner: context.owner,
      path: path,
      fileRef: context.sha,
    },
    {
      enabled: !isFolder && !showUpdatedContents && !isTooLarge,
      cacheTime: 0,
    }
  );

  const onRequestUpdateContent = useCallbackWithProps(
    ({
        path,
        context,
        updatedContents,
        setUpdatedContents,
        showUpdatedContents,
        fileData,
      }) =>
      (newContent: string) => {
        if (showUpdatedContents) {
          setUpdatedContents(
            Immer.produce(updatedContents, (updatedContents) => {
              if (newContent === updatedContents[path].original) {
                delete updatedContents[path];
              } else {
                updatedContents[path].content = newContent;
              }
            })
          );
        } else if (fileData) {
          if (context.sha === branchName) {
            setUpdatedContents(
              Immer.produce(updatedContents, (updatedContents) => {
                if (newContent !== fileData.content) {
                  updatedContents[path] = {
                    sha: fileData.context.sha,
                    original: fileData.content,
                    content: newContent,
                  };
                }
              })
            );
          }
        }
      },
    {
      path,
      context,
      updatedContents,
      setUpdatedContents,
      showUpdatedContents,
      fileData,
    }
  );

  let content: string = "";
  if (showUpdatedContents) {
    content = updatedContents[path].content;
  } else if (fileData) {
    content = fileData.content;
  }

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
      content={content}
      onRequestUpdateContent={onRequestUpdateContent}
    />
  );
}

type BlockPaneProps = {
  fileInfo: RepoFiles[0];
  path: string;
  token: string;
  metadata: any;
  setRequestedMetadata: (metadata: any) => void;
  isFullscreen: boolean;
  context: Context;
  theme: string;
  branchName: string;
  updatedContents: UpdatedContents;
  setUpdatedContents: (_: UpdatedContents) => void;
  onSaveChanges: () => void;
};

function BlockPane({
  fileInfo,
  path,
  token,
  metadata,
  setRequestedMetadata,
  isFullscreen,
  context,
  theme,
  branchName,
  updatedContents,
  setUpdatedContents,
  onSaveChanges,
}: BlockPaneProps) {
  const router = useRouter();

  const isFolder = fileInfo.type !== "blob";

  const manageBlockResult = useManageBlock({
    path,
    storedDefaultBlock: metadata[path]?.default,
    isFolder,
  });

  const block = manageBlockResult.data?.block;

  useEffect(() => {
    if (block) {
      const blockKey = getBlockKey(block);
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
    <>
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
          onSaveChanges,
        }}
      />
      {block && (
        <BlockPaneBlock
          {...{
            token,
            block,
            fileInfo,
            path,
            context,
            isFolder,
            theme,
            branchName,
            updatedContents,
            setUpdatedContents,
          }}
        />
      )}
    </>
  );
}

type CommitsPaneProps = {
  isFullscreen: boolean;
  context: Context;
  branchName: string;
  timeline: undefined | RepoTimeline;
  updatedContent: undefined | UpdatedContent;
  clearUpdatedContent: () => void;
};

function CommitsPane({
  isFullscreen,
  context,
  branchName,
  timeline,
  updatedContent,
  clearUpdatedContent,
}: CommitsPaneProps) {
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
          <ActivityFeed
            context={context}
            branchName={branchName}
            timeline={timeline}
            updatedContent={updatedContent}
            clearUpdatedContent={clearUpdatedContent}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface RepoDetailInnerProps {
  token: string;
  repoInfo: RepoInfo;
  branches: Branch[];
  branchName: string;
  files: undefined | RepoFiles;
  timeline: undefined | RepoTimeline;
}

export function RepoDetailInner(props: RepoDetailInnerProps) {
  const { token, repoInfo, branches, branchName, files, timeline } = props;
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
  const appContext = useContext(AppContext);

  const context = useMemo(
    () => ({
      repo,
      owner,
      path,
      sha: fileRef || branchName,
    }),
    [repo, owner, path, fileRef]
  );

  const fileInfo =
    path === ""
      ? { type: "tree" } // the root path is not included in `files`
      : files && files.find((d) => d.path === path);

  const setBranchName = (branchName: string) => {
    const query = { ...router.query, branch: branchName };
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
    branchName,
  });

  let isBranchable =
    context.sha === branchName ||
    (timeline && timeline.length > 0 && timeline[0].sha === branchName);

  const [updatedContents, setUpdatedContents] = useState<UpdatedContents>({});
  const [showCommitCodeDialog, setShowCommitCodeDialog] = useState(false);
  const onSaveChanges = updatedContents[path]
    ? () => {
        setShowCommitCodeDialog(true);
      }
    : undefined;
  const updatedContent = updatedContents[path];
  const clearUpdatedContent = () =>
    setUpdatedContents(
      Immer.produce(updatedContents, (updatedContents) => {
        delete updatedContents[path];
      })
    );

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <Header
        isFullscreen={isFullscreen}
        owner={owner}
        repo={repo}
        description={repoInfo.description}
        contributors={repoInfo.contributors}
        branchName={branchName}
        branches={branches}
        onChangeBranch={setBranchName}
      />

      {!appContext.hasRepoInstallation && (
        <Flash className="text-sm" full variant="warning">
          <StyledOcticon icon={AlertIcon} />
          The Blocks GitHub app is not installed on this repository. You won't
          be able to save changes to files or open pull-requests.{" "}
          <Link
            underline
            muted
            target="_blank"
            rel="noopener"
            href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`}
          >
            Install app
          </Link>
        </Flash>
      )}

      <div className="flex flex-1 overflow-hidden">
        <FileTreePane
          {...{
            isFullscreen,
            owner,
            repo,
            files,
            path,
            updatedContents,
          }}
        />
        <div className="flex-1 overflow-hidden">
          {fileInfo && (
            <BlockPane
              {...{
                fileInfo,
                path,
                token,
                metadata,
                setRequestedMetadata,
                isFullscreen,
                context,
                theme,
                branchName,
                updatedContents,
                setUpdatedContents,
                onSaveChanges,
              }}
            />
          )}
        </div>

        <CommitsPane
          isFullscreen={isFullscreen}
          context={context}
          branchName={branchName}
          timeline={timeline}
          updatedContent={updatedContent}
          clearUpdatedContent={clearUpdatedContent}
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
      {!!showCommitCodeDialog && updatedContents[path] && (
        <CommitCodeDialog
          repo={repo}
          owner={owner}
          path={path}
          sha={context.sha}
          newCode={updatedContents[path].content}
          currentCode={updatedContents[path].original}
          onCommit={() => {
            setShowCommitCodeDialog(false);
            clearUpdatedContent();
          }}
          onCancel={() => {
            setShowCommitCodeDialog(false);
          }}
          isOpen
          token={token}
          branchName={branchName}
          branchingDisabled={!isBranchable}
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
    blockKey,
  } = router.query as Record<string, string>;
  const {
    data: { user },
  } = useSession();

  const repoInfo = useRepoInfo({ repo, owner });
  const branches = useGetBranches({ repo, owner });

  let branchName: string | undefined = undefined;
  if (branches.data) {
    if (branchParam && branches.data.some((b) => b.name === branchParam)) {
      branchName = branchParam;
    } else {
      branchName = repoInfo.data.default_branch;
    }
  }

  useEffect(() => {
    if (branchName) {
      if (branchParam !== branchName) {
        const query = { ...router.query, branch: branchName };
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
  }, [branchName]);

  const repoFiles = useRepoFiles(
    {
      repo,
      owner,
      sha: branchName,
    },
    { enabled: Boolean(branchName) }
  );

  const repoTimeline = useRepoTimeline(
    {
      repo,
      owner,
      path,
      sha: branchName,
    },
    { enabled: Boolean(branchName) }
  );

  const accessProhibited =
    !user.isHubber &&
    // @ts-ignore
    Boolean(CODEX_BLOCKS.find((cb) => getBlockKey(cb) === blockKey));
  const queries = [repoInfo, branches, repoFiles, repoTimeline];
  const hasQueryErrors = queries.some((res) => res.status === "error");
  const showErrorState = hasQueryErrors || accessProhibited;

  if (showErrorState) {
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
        branchName={branchName}
        files={repoFiles.data}
        timeline={repoTimeline.data}
      />
    );
  } else {
    return <FullPageLoader />;
  }
}
