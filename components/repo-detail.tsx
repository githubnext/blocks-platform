import { Box, Button } from "@primer/components";
import { useRouter } from "next/router";
import { useTheme } from "@primer/components";
import { useEffect, useState } from "react";

import { useFileContent, useMetadata, useRepoFiles, useRepoInfo } from "hooks";
import { FileViewer } from "components/file-viewer-with-toggle";
import { FolderViewer } from "components/folder-viewer-with-toggle";
import { ActivityFeed } from "components/ActivityFeed";
import { GitHubHeader } from "./github-header";
import { RepoHeader } from "./repo-header";
import { Sidebar } from "./Sidebar";

import dynamic from "next/dynamic";
const ViewerPicker = dynamic(() => import("./viewer-picker"), { ssr: false });

interface RepoDetailProps {
  session: Session;
}

const defaultFileViewer = {
  description: "A basic code viewer",
  entry: "/src/viewers/file-viewers/code/index.tsx",
  extensions: ["*"],
  title: "Code viewer",
  type: "file",
}

const defaultFolderViewer = {
  "type": "folder",
  "title": "Minimap",
  "description": "A visualization of your folders and files",
  "entry": "/src/viewers/folder-viewers/minimap/index.tsx"
}
export function RepoDetail(props: RepoDetailProps) {
  const { session } = props;
  const router = useRouter();
  const { setColorMode } = useTheme();
  const [viewer, setViewer] = useState<Viewer>(defaultFolderViewer);

  const {
    repo,
    owner,
    path = "",
    theme,
    fileRef,
  } = router.query;

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
      : true;

  useEffect(() => {
    if (repoFilesStatus !== "success") return
    const viewer = isFolder ? defaultFolderViewer : defaultFileViewer;
    setViewer(viewer);
  }, [isFolder]);

  const { metadata, onUpdateMetadata } = useMetadata({
    owner: owner as string,
    repo: repo as string,
    metadataPath: `.github/viewers/all`,
    filePath: path as string,
    token: session.token as string,
  });

  // const defaultViewer = metadata.defaultViewer;
  // const onSetDefaultViewer = (viewerId: string) => {
  //   onUpdateMetadata({
  //     defaultViewer: viewerId,
  //   });
  // };

  const viewerContext = {
    repo: "composable-github-example-viewers",
    owner: "githubnext",
  };

  const {
    data: viewersInfo,
    status: viewersStatus,
    error: viewersError,
  } = useFileContent({
    repo: "composable-github-example-viewers",
    owner: "githubnext",
    token: session.token as string,
    path: "package.json",
  });
  const viewersInfoParsed = viewersInfo?.content
    ? JSON.parse(viewersInfo.content)
    : {};
  const viewers = viewersInfoParsed?.viewers || [];

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
              fileChanges={repoInfo?.fileChanges}
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
                <ViewerPicker
                  viewers={(viewers || []).filter(
                    (d) => d.type === (isFolder ? "folder" : "file")
                  )}
                  isFolder={isFolder}
                  path={path as string}
                  onChange={setViewer}
                  value={viewer}
                />
                {/* {viewerType !== defaultViewer && (
              <Button
                fontSize="1"
                ml={2}
                onClick={() => onSetDefaultViewer(viewerType)}
              >
                Set as default for all users
              </Button>
            )} */}
              </Box>
            </div>
          </div>
          {!!viewer &&
            repoFilesStatus !== "loading" &&
            (isFolder ? (
              <FolderViewer
                key={viewer.entry}
                allFiles={files}
                theme={(theme as string) || "light"}
                viewerContext={viewerContext}
                context={{
                  folder: "",
                  ...context
                }}
                dependencies={viewersInfoParsed.dependencies}
                viewer={viewer}
                session={session}
              />
            ) :
              isTooLarge ? (
                <div className="italic p-4 pt-40 text-center mx-auto text-gray-600">
                  Oh boy, that's a honkin file! It's {size / 1000} KBs.
                </div>
              ) : (
                <FileViewer
                  key={viewer.entry}
                  context={{
                    file: "",
                    ...context,
                  }}
                  theme={(theme as string) || "light"}
                  viewer={viewer}
                  dependencies={viewersInfoParsed.dependencies}
                  viewerContext={viewerContext}
                  session={session}
                />
              ))}
        </div>

        {/* <div className="flex-none w-80 h-full border-l border-gray-200">
          {repoInfoStatus === "loading" ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="animate-pulse flex space-y-4">
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
              </div>
            </div>
          ) : (
            // <ActivityFeed activity={repoInfo?.activity} />
            null
          )}
        </div> */}
      </div>
    </div>
  );
}
