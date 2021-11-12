import { Session } from "next-auth";
import { useRouter } from "next/router";
import { useTheme } from "@primer/components";
import { useEffect, useMemo } from "react";

import { useFileContent, useMetadata, useRepoFiles, useRepoInfo } from "hooks";
import { FileViewer } from "components/file-viewer-with-toggle";
import { FolderViewer } from "components/folder-viewer-with-toggle";
import { ActivityFeed } from "components/ActivityFeed";
import { viewers } from "components/viewers";
import { getViewerFromFilename } from "lib";
import { GitHubHeader } from "./github-header";
import { RepoHeader } from "./repo-header";
import { Sidebar } from "./Sidebar";

interface IndexPageDetailProps {
  session: Session;
}

export function IndexPageDetail(props: IndexPageDetailProps) {
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

  useEffect(() => {
    setColorMode(theme === "dark" ? "night" : "day");
  }, [theme]);

  const { data: folderData, status } = useFileContent(
    {
      repo: repo as string,
      owner: owner as string,
      path: path as string,
      fileRef: fileRef as string,
    },
    {
      enabled: Boolean(repo) && Boolean(owner),
      refetchOnWindowFocus: false,
    }
  );

  const isFolder =
    status !== "success" ? false : folderData?.[0]?.path !== path;
  const data = folderData?.[0];

  const { data: repoInfo, status: repoInfoStatus } = useRepoInfo({
    repo: repo as string,
    owner: owner as string,
  });

  const { data: files, status: repoFilesStatus } = useRepoFiles({
    repo: repo as string,
    owner: owner as string,
  });

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: `.github/viewers/all`,
    filePath: path as string,
  });

  const defaultViewer =
    metadata.defaultViewer ||
    (isFolder ? "readme" : getViewerFromFilename(data?.name)) ||
    "code";
  const onSetDefaultViewer = (viewerId: string) => {
    onUpdateMetadata({
      defaultViewer: viewerId,
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const extension = (path as string)?.split(".").slice(-1)[0];
    const relevantViewers = viewers
      .filter(
        (viewer) =>
          viewer.extensions.includes(extension) ||
          viewer.extensions.includes("*")
      )
      .map((v) => ({ id: v.id, label: v.label }))
      .sort((a, b) => (a.id === defaultViewer ? -1 : 1)); // put default viewer first
  }, [path, defaultViewer]);

  const findNestedItem = (path: string, files: any) => {
    const nextItemName = path.split("/")[0];
    const nextItem = files.find((item) => item.name === nextItemName);
    const nextPath = path.split("/").slice(1).join("/");
    return nextPath
      ? findNestedItem(nextPath, nextItem?.children || [])
      : nextItem;
  };
  const folderFiles = useMemo(
    () =>
      (isFolder && path
        ? findNestedItem(path as string, files)?.children
        : files) || [],
    [isFolder, files]
  );

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <GitHubHeader />
      {repoInfoStatus === "success" && (
        <RepoHeader
          owner={owner as string}
          repo={repo as string}
          // @ts-ignore
          description={repoInfo.description}
          // @ts-ignore
          contributors={repoInfo.contributors}
        />
      )}
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
              fileChanges={repoInfo.fileChanges}
            />
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {status === "loading" && (
            <p className="text-sm w-full p-8">Loading...</p>
          )}
          {status === "success" &&
            (isFolder ? (
              <FolderViewer
                theme={(theme as string) || "light"}
                path={path as string}
                data={folderFiles}
                defaultViewer={defaultViewer}
                viewerOverride={viewerOverride as string}
                onSetDefaultViewer={onSetDefaultViewer}
                hasToggle
              />
            ) : (
              <FileViewer
                theme={(theme as string) || "light"}
                data={data}
                defaultViewer={defaultViewer}
                viewerOverride={viewerOverride as string}
                onSetDefaultViewer={onSetDefaultViewer}
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
            <ActivityFeed activity={repoInfo.activity} />
          )}
        </div>
      </div>
    </div>
  );
}
