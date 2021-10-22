import { useTheme } from "@primer/components";
import { FileViewer } from "components/file-viewer-with-toggle";
import { viewers } from "components/viewers";
import { useFileContent } from "hooks";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getViewerFromFilename } from "lib";

export default function Home() {
  const router = useRouter();
  const { setColorMode } = useTheme();
  const { repo, owner, path, theme, fileRef, viewerOverride } = router.query;
  const { data, status } = useFileContent(
    {
      repo: repo as string,
      owner: owner as string,
      path: path as string,
      fileRef: fileRef as string,
    },
    {
      enabled: Boolean(repo) && Boolean(owner) && Boolean(path),
      refetchOnWindowFocus: false,
    }
  );
  const defaultViewer = getViewerFromFilename(data?.name) || "code";
  console.log("defaultViewer: ", defaultViewer);

  useEffect(() => {
    setColorMode(theme === "dark" ? "night" : "day");
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const extension = (path as string)?.split(".").slice(-1)[0];
    const relevantViewers = viewers.filter(viewer => (
      viewer.extensions.includes(extension) || viewer.extensions.includes("*")
    )).map((v) => ({ id: v.id, label: v.label }));
    relevantViewers.sort((a,b) => (a.id === defaultViewer) ? -1 : 1); // put default viewer first
    console.log("right viewers");
    console.log(relevantViewers, path, extension);
    window.parent.postMessage(
      {
        type: "set-viewers",
        viewers: relevantViewers,
      },
      "*"
    );
  }, [path, defaultViewer]);

  return (
    <>
      {status === "loading" && <p className="text-sm w-full p-8">Loading...</p>}
      {status === "success" && (
        <FileViewer
          theme={theme as string}
          data={data}
          defaultViewer={defaultViewer}
          viewerOverride={viewerOverride as string}
        />
      )}
    </>
  );
}
