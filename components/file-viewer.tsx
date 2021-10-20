import { useMemo } from "react";
import { DirectoryItem } from "hooks";
import SyntaxHighlighter from "react-syntax-highlighter";
import { Grid } from '@githubocto/flat-ui';

interface FileViewerProps {
  data: DirectoryItem;
  viewerType: string;
}

export function FileViewer(props: FileViewerProps) {
  const { data, viewerType } = props;
  const { name, size, content } = data;

  const code = Buffer.from(content, "base64").toString();
  const viewer = viewers.find(d => d.id === viewerType) || {} as any;
  const Viewer = viewer.component || CodeViewer

  return (
    <div className="w-full">
      <Viewer contents={code} />
    </div>
  );
}


const viewers = [{
  id: "flat",
  name: "Flat Data",
  component: FlatViewer
}]

function CodeViewer({ contents }: { contents: string }) {
  return (
    <div className="text-sm bg-white">
      <SyntaxHighlighter>{contents}</SyntaxHighlighter>
    </div>
  );
}
function FlatViewer({ contents }: { contents: string }) {
  const data = useMemo(() => {
    try {
      return JSON.parse(contents);
    } catch (e) {
      return {};
    }
  }, [contents]);

  return (
    <Grid data={data} />
  );
}