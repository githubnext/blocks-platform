import { useTheme } from "@primer/components";
import { FileViewer } from "components/file-viewer-with-toggle";
import { viewers } from "components/viewers";
import { useFileContent } from "hooks";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { setColorMode } = useTheme();
  const { repo, owner, path, theme, viewerOverride } = router.query;
  const { data, status } = useFileContent(
    {
      repo: repo as string,
      owner: owner as string,
      path: path as string,
    },
    {
      enabled: Boolean(repo) && Boolean(owner) && Boolean(path),
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    setColorMode(theme === "dark" ? "night" : "day");
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.parent.postMessage(
      {
        type: "set-viewers",
        viewers: viewers.map((v) => ({ id: v.id, label: v.label })),
      },
      "*"
    );
  }, []);

  return (
    <>
      {status === "loading" && <p className="text-sm w-full p-8">Loading...</p>}
      {status === "success" && (
        <FileViewer theme={theme as string} data={data} viewerOverride={viewerOverride as string} />
      )}
    </>
  );
}
