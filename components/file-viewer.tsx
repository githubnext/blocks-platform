import { DirectoryItem } from "hooks";
import SyntaxHighlighter from "react-syntax-highlighter";

interface FileViewerProps {
  data: DirectoryItem;
}

export function FileViewer(props: FileViewerProps) {
  const { data } = props;
  const { name, size, content } = data;

  const code = Buffer.from(content, "base64").toString();

  return (
    <div className="border overflow-hidden rounded">
      <div className="border-b p-2 bg-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <span className="inline-block">{name}</span>
          <span className="ml-2 text-sm font-mono">{size} bytes</span>
        </div>
        <div>
          <select name="" id="">
            <select value="" name="" id="">
              Choose a viewer
            </select>
            <option value="viewer-1">Viewer 1</option>
            <option value="viewer-2">Viewer 2</option>
            <option value="viewer-3">Viewer 3</option>
          </select>
        </div>
      </div>
      <div className="text-sm bg-white">
        <SyntaxHighlighter>{code}</SyntaxHighlighter>
      </div>
    </div>
  );
}
