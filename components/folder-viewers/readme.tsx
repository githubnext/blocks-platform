import { MarkdownViewer } from "components/viewers/markdown";
import { useFileContent } from "hooks";
import { useMemo } from "react";
import { FolderViewerProps } from ".";

export function ReadmeViewer(props: FolderViewerProps) {
  const { meta, files } = props;

  const { data } = useFileContent({
    owner: meta.owner,
    repo: meta.repo,
    path: (meta.path ? meta.path + "/" : "") + "README.md",
    fileRef: meta.sha
  }, {
    refetchOnWindowFocus: false,
  })
  const contents = data?.[0] && Buffer.from(data?.[0]?.content, "base64").toString();

  const fileMeta = useMemo(() => ({
    ...meta,
    language: "markdown",
  }), [meta])

  return (
    <div className={`h-full`}>
      <MarkdownViewer
        contents={contents}
        meta={fileMeta}
      />
    </div>
  );
}
