import { useContext } from "react";
import * as Immer from "immer";
import { Flash, Link, StyledOcticon, useTheme } from "@primer/react";
import { AlertIcon } from "@primer/octicons-react";
import {
  getBlockKey,
  useGetBranches,
  useMetadata,
  useRepoFiles,
  useRepoInfo,
  useRepoTimeline,
} from "hooks";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import { FullPageLoader } from "../full-page-loader";
import { UpdateCodeModal } from "../UpdateCodeModal";
import { CommitCodeDialog } from "../commit-code-dialog";
import Header from "./Header";
import FileTreePane from "./FileTreePane";
import BlockPane from "./BlockPane";
import CommitsPane from "./CommitsPane";
import type { RepoFiles } from "@githubnext/blocks";
import { AppContext } from "context";
import { CODEX_BLOCKS } from "lib";
import { useSession } from "next-auth/react";
import useBlockFrameMessages from "./use-block-frame-messages";

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
  token: string;
  repoInfo: RepoInfo;
  branches: Branch[];
  branchName: string;
  files: undefined | RepoFiles;
  timeline: undefined | RepoTimeline;
}

const blockTypes = {
  tree: "folder",
  blob: "file",
};

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

  useBlockFrameMessages({
    token,
    owner,
    repo,
    branchName,
    files,
    updatedContents,
    setUpdatedContents,
  });

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
            href={appContext.installationUrl}
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
                branchName,
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
          blockType={blockTypes[fileInfo?.type]}
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
    data: { user },
  } = useSession();
  const {
    repo,
    owner,
    branch: branchParam,
    path = "",
    blockKey,
  } = router.query as Record<string, string>;

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
