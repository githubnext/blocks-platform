import { Session } from "next-auth";
import { useRouter } from "next/router";
import { useTheme } from "@primer/components";
import { useEffect } from "react";

import { useMetadata, useRepoFiles, useRepoInfo } from "hooks";
import { FileViewer } from "components/file-viewer-with-toggle";
import { FolderViewer } from "components/folder-viewer-with-toggle";
import { ActivityFeed } from "components/ActivityFeed";
import { GitHubHeader } from "./github-header";
import { RepoHeader } from "./repo-header";
import { Sidebar } from "./Sidebar";

interface RepoDetailProps {
  session: Session;
}

export function RepoDetail(props: RepoDetailProps) {
  const { session } = props;
  const router = useRouter();
  const { setColorMode } = useTheme();

  const {
    repo,
    owner,
    path = "",
    theme,
    fileRef,
    viewerOverride,
  } = router.query;

  const context = {
    repo: repo as string,
    owner: owner as string,
    path: path as string,
    fileRef: fileRef as string,
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
      ? files?.find((d) => d.path === path)?.type === "tree"
      : false;

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: `.github/viewers/all`,
    filePath: path as string,
    token: session.token as string,
  });

  const defaultViewer = metadata.defaultViewer;
  const onSetDefaultViewer = (viewerId: string) => {
    onUpdateMetadata({
      defaultViewer: viewerId,
    });
  };

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
      <GitHubHeader />
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
          {repoFilesStatus === "loading" || repoInfoStatus === "loading" ? (
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
              fileChanges={repoInfo?.fileChanges}
            />
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {repoFilesStatus !== "loading" &&
            (isFolder ? (
              <FolderViewer
                context={context}
                theme={(theme as string) || "light"}
                allFiles={files}
                defaultViewer={defaultViewer}
                viewerOverride={viewerOverride as string}
                onSetDefaultViewer={onSetDefaultViewer}
                session={session}
                hasToggle
              />
            ) : isTooLarge ? (
              <div className="italic p-4 pt-40 text-center mx-auto text-gray-600">
                Oh boy, that's a honkin file! It's {size / 1000} KBs.
              </div>
            ) : (
              <FileViewer
                context={context}
                theme={(theme as string) || "light"}
                defaultViewer={defaultViewer}
                viewerOverride={viewerOverride as string}
                onSetDefaultViewer={onSetDefaultViewer}
                session={session}
                hasToggle
              />
            ))}
        </div>

        <div className="flex-none w-80 h-full border-l border-gray-200">
          {repoInfoStatus === "loading" ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="animate-pulse flex space-y-4">
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
              </div>
            </div>
          ) : (
            <ActivityFeed activity={repoInfo?.activity} />
          )}
        </div>
      </div>
    </div>
  );
}
