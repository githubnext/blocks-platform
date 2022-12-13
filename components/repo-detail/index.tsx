import { useEffect, useRef, useState, useMemo, useContext } from "react";
import * as Immer from "immer";
import { useQueryClient } from "react-query";
import { Link, useTheme } from "@primer/react";
import { QueryKeyMap } from "lib/query-keys";
import type { BlocksQueryMeta } from "ghapi";
import { AppContext } from "context";
import {
  getBlockKey,
  updateFileContents,
  useGetBranches,
  useIsFullscreen,
  useMetadata,
  useRepoFiles,
  useRepoInfo,
  useRepoTimeline,
} from "hooks";
import Head from "next/head";
import { useRouter } from "next/router";
import { FullPageLoader } from "../full-page-loader";
import { UpdateCodeModal } from "../UpdateCodeModal";
import { CommitCodeDialog } from "../commit-code-dialog";
import Header from "./Header";
import FileTreePane from "./FileTreePane";
import BlockPane from "./BlockPane";
import CommitsPane from "./CommitsPane";
import type { RepoFiles } from "@githubnext/blocks";
import { CODEX_BLOCKS } from "lib";
import { useSession } from "next-auth/react";
import useBlockFrameMessages from "./use-block-frame-messages";
import { WarningModal } from "components/WarningModal";
import makeBranchPath from "utils/makeBranchPath";
import { useVisibility } from "state";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

export type Context = {
  repo: string;
  owner: string;
  path: string;
  sha: string;
};

export type UpdatedContent = {
  sha: string;
  original: string;
  content: string;
};
export type UpdatedContents = Record<string, UpdatedContent>;

interface RepoDetailInnerProps {
  repoInfo: RepoInfo;
  branches: Branch[];
  branchName: string;
  path: string;
  files: undefined | RepoFiles;
  timeline: undefined | RepoTimeline;
}

const blockTypes = {
  tree: "folder",
  blob: "file",
};

export function RepoDetailInner(props: RepoDetailInnerProps) {
  const queryClient = useQueryClient();
  const appContext = useContext(AppContext);
  const { repoInfo, branches, branchName, path, files, timeline } = props;
  const router = useRouter();
  const { setColorMode } = useTheme();
  const { repo, owner, theme, fileRef } = router.query as Record<
    string,
    string
  >;
  const [requestedBlockMetadata, setRequestedBlockMetadata] = useState(null);
  const [requestedMetadata, setRequestedMetadata] = useState<{
    path: string;
    current: string;
    new: string;
    onSubmit: () => void;
  }>(null);
  const isFullscreen = useIsFullscreen();

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
    const query = {
      ...router.query,
      branchPath: makeBranchPath(branchName, path),
    };
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
  const committedContents = useRef<Record<string, string>>({});

  useBlockFrameMessages({
    owner,
    repo,
    branchName,
    files,
    updatedContents,
    setUpdatedContents,
    setRequestedMetadata,
    committedContents: committedContents.current,
  });

  const { fileTree, commitsPane } = useVisibility();

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <Head>
        <title>
          {/* mimicking github.com's title */}
          GitHub Blocks:
          {path ? ` ${repo}/${path}` : ` ${repo}`}
          {branchName ? ` at ${branchName}` : ""}
          {` · ${owner}/${repo}`}
        </title>
      </Head>
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

      <LayoutGroup>
        <div className="flex flex-1 overflow-hidden divide-x">
          <AnimatePresence mode="popLayout">
            {fileTree && !isFullscreen && (
              <motion.div
                key="file-tree"
                className="w-[17rem]"
                layout
                exit={{ x: "-100%" }}
                animate={{ x: 0 }}
                initial={{ x: fileTree ? 0 : "-100%" }}
              >
                <FileTreePane
                  {...{
                    owner,
                    repo,
                    branchName,
                    files,
                    path,
                    updatedContents,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            key="block-content"
            layout
            className="relative flex flex-col flex-1 overflow-hidden z-10"
          >
            {fileInfo && (
              <BlockPane
                {...{
                  fileInfo,
                  path,
                  metadata,
                  setRequestedBlockMetadata,
                  context,
                  branchName,
                  onSaveChanges,
                }}
              />
            )}
          </motion.div>

          <AnimatePresence mode="popLayout">
            {commitsPane && !isFullscreen && (
              <motion.div
                key="commits-pane"
                layout
                exit={{ x: "100%" }}
                animate={{ x: 0 }}
                initial={{ x: commitsPane ? 0 : "100%" }}
              >
                <CommitsPane
                  context={context}
                  branchName={branchName}
                  timeline={timeline}
                  updatedContent={updatedContent}
                  clearUpdatedContent={clearUpdatedContent}
                  blockType={blockTypes[fileInfo?.type]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
      {!!requestedBlockMetadata && (
        <UpdateCodeModal
          path={`.github/blocks/all.json`}
          newCode={JSON.stringify(requestedBlockMetadata, null, 2)}
          currentCode={JSON.stringify(metadata, null, 2)}
          onSubmit={() => {
            onUpdateMetadata(requestedBlockMetadata, `.github/blocks/all.json`);
          }}
          onClose={() => setRequestedBlockMetadata(null)}
        />
      )}
      {!!requestedMetadata &&
        (repoInfo.permissions?.push && appContext.hasRepoInstallation ? (
          <UpdateCodeModal
            path={requestedMetadata.path}
            newCode={requestedMetadata.new}
            currentCode={requestedMetadata.current}
            onSubmit={() => {
              requestedMetadata.onSubmit();
              const { token, userToken } = queryClient.getDefaultOptions()
                .queries.meta as BlocksQueryMeta;
              queryClient.executeMutation({
                mutationFn: updateFileContents,
                variables: {
                  owner,
                  repo,
                  path: requestedMetadata.path,
                  content: requestedMetadata.new,
                  ref: branchName,
                  branch: branchName,
                  token,
                  userToken,
                },
                onSuccess: () => {
                  queryClient.invalidateQueries(
                    QueryKeyMap.metadata.factory({
                      owner,
                      repo,
                      path: requestedMetadata.path,
                      fileRef: branchName,
                    })
                  );
                  queryClient.invalidateQueries(
                    QueryKeyMap.files.factory({
                      owner,
                      repo,
                      sha: branchName,
                    })
                  );
                },
              });
            }}
            onClose={() => setRequestedMetadata(null)}
          />
        ) : (
          <WarningModal
            title="Permission needed"
            message={
              !appContext.hasRepoInstallation ? (
                <>
                  The Blocks GitHub app is not installed on this repository.{" "}
                  <Link
                    underline
                    muted
                    target="_blank"
                    rel="noopener"
                    href={appContext.installationUrl}
                  >
                    Install the app
                  </Link>{" "}
                  to save changes to files or open pull-requests.
                </>
              ) : (
                "You do not have permission to edit this file"
              )
            }
            onClose={() => setRequestedMetadata(null)}
          />
        ))}
      {!!showCommitCodeDialog && updatedContents[path] && (
        <CommitCodeDialog
          repo={repo}
          owner={owner}
          path={path}
          newCode={updatedContents[path].content}
          currentCode={updatedContents[path].original}
          onCommit={() => {
            committedContents.current = {
              [path]: updatedContents[path].content,
            };
            clearUpdatedContent();
            setShowCommitCodeDialog(false);
          }}
          onCancel={() => {
            setShowCommitCodeDialog(false);
          }}
          isOpen
          branchName={branchName}
          branchingDisabled={!isBranchable}
        />
      )}
    </div>
  );
}

export function RepoDetail() {
  const router = useRouter();
  const {
    data: { user },
  } = useSession();
  const { repo, owner, blockKey } = router.query as Record<string, string>;
  const { branchPath } = router.query as { branchPath: string[] };

  const repoInfo = useRepoInfo({ repo, owner });
  const branches = useGetBranches({ repo, owner });

  let branchName: string | undefined = undefined;
  let path: string | undefined;
  if (branches.data) {
    const branchPathString = branchPath.join("/");
    const branch = branches.data.find(
      (b) =>
        branchPathString === b.name || branchPathString.startsWith(b.name + "/")
    );
    if (branch) {
      branchName = branch.name;
      path = branchPathString.slice(branch.name.length + 1);
    } else {
      // let's switch to the default branch and clear the path,
      // since we don't know how to parse the path segments
      branchName = repoInfo.data.default_branch;
      path = "";
    }
  }

  useEffect(() => {
    if (branches.data) {
      const currentBranchPath = makeBranchPath(branchName, path);
      if (branchPath.join("/") !== currentBranchPath.join("/")) {
        const query = {
          ...router.query,
          branchPath: currentBranchPath,
        };
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
  }, [branches.data]);

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
    CODEX_BLOCKS.some((cb) => {
      // @ts-ignore
      return getBlockKey(cb) === blockKey;
    });
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
        repoInfo={repoInfo.data}
        branches={branches.data}
        branchName={branchName}
        path={path}
        files={repoFiles.data}
        timeline={repoTimeline.data}
      />
    );
  } else {
    return <FullPageLoader />;
  }
}
