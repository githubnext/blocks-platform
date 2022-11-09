import { useEffect, useRef, useState, useMemo } from "react";
import * as Immer from "immer";
import { useQuery, useQueryClient } from "react-query";
import { useTheme } from "@primer/react";
import { QueryKeyMap } from "lib/query-keys";
import type { BlocksQueryMeta } from "ghapi";
import {
  getBlockKey,
  updateFileContents,
  useGetBranches,
  useMetadata,
  useRepoFiles,
  useRepoInfo,
  useRepoTimeline,
} from "hooks";
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
  files: undefined | RepoFiles;
  timeline: undefined | RepoTimeline;
}

const blockTypes = {
  tree: "folder",
  blob: "file",
};

export function RepoDetailInner(props: RepoDetailInnerProps) {
  const queryClient = useQueryClient();
  const { repoInfo, branches, branchName, files, timeline } = props;
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
  const [requestedBlockMetadata, setRequestedBlockMetadata] = useState(null);
  const [requestedMetadata, setRequestedMetadata] = useState<{
    path: string;
    current: string;
    new: string;
    onSubmit: () => void;
  }>(null);
  const isFullscreen = mode === "fullscreen";

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
        <div className="relative flex flex-col flex-1 overflow-hidden z-10">
          {fileInfo && (
            <BlockPane
              {...{
                fileInfo,
                path,
                metadata,
                setRequestedBlockMetadata,
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
      {!!requestedMetadata && (
        <UpdateCodeModal
          path={requestedMetadata.path}
          newCode={requestedMetadata.new}
          currentCode={requestedMetadata.current}
          onSubmit={() => {
            requestedMetadata.onSubmit();
            const { token, userToken } = queryClient.getDefaultOptions().queries
              .meta as BlocksQueryMeta;
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
              },
            });
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

type VerifyResponse = {
  login: string;
  alreadySignedUp: boolean;
  hasAccess: boolean;
};

export function RepoDetail() {
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

  const verifyResponse = useQuery<any, VerifyResponse>(
    "verifyResponse",
    (ctx) => {
      return fetch(
        process.env.NEXT_PUBLIC_FUNCTIONS_URL +
          `api/verify?` +
          new URLSearchParams({
            token: (ctx.meta as BlocksQueryMeta).token,
            project: "blocks",
          })
      ).then((r) => r.json());
    }
  );

  useEffect(() => {
    if (!verifyResponse.data) return;
    if (!verifyResponse.data.hasAccess) {
      router.push("/signup");
    }
  }, [verifyResponse.data]);

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
  const queries = [verifyResponse, repoInfo, branches, repoFiles, repoTimeline];
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
  } else if (
    verifyResponse.data?.hasAccess &&
    repoInfo.status === "success" &&
    branches.status === "success"
  ) {
    return (
      <RepoDetailInner
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
