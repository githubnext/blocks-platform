import { FolderViewerProps } from ".";
import { Tree } from "components/Tree"
import { useMemo } from "react";
import { useRouter } from "next/router";

export function MinimapViewer(props: FolderViewerProps) {
  const { meta, files } = props;
  const router = useRouter();
  const query = router.query;

  const data = useMemo(() => ({
    children: files
  }), [files])

  return (
    <div className={`text-sm p-8 w-[600px] h-[600px] mx-auto flex items-center code ${meta.theme}`}>
      <Tree
        data={data}
        onClickFile={path => {
          router.push({
            pathname: router.pathname,
            query: {
              ...query,
              path: path
            }
          })
        }}
      />
    </div>
  );
}
