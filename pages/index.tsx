import { FileViewer } from "components/file-viewer-with-toggle";
import { useFileContent } from "hooks";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const { repo, owner, path } = router.query;
  const { data, status } = useFileContent(
    {
      repo: repo as string,
      owner: owner as string,
      path: path as string,
    },
    {
      enabled: Boolean(repo) && Boolean(owner) && Boolean(path),
    }
  );

  return (
    <div>
      {status === "loading" && <p className="text-sm w-full p-8">Loading...</p>}
      {status === "success" && <FileViewer data={data} />}
    </div>
  );
}
