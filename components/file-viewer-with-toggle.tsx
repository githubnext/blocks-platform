import { DirectoryItem } from "hooks";
import React, { useMemo, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { Grid } from '@githubocto/flat-ui';

interface FileViewerProps {
  data: DirectoryItem;
}

export function FileViewer(props: FileViewerProps) {
  const { data } = props;
  const { name, size, content } = data;
  const [viewerType, setViewerType] = useState("");

  const code = Buffer.from(content, "base64").toString();
  const viewer = viewers.find(d => d.id === viewerType) || {} as any;
  const Viewer = viewer.component || CodeViewer

  return (
    <div className="border overflow-hidden rounded">
      <div className="border-b p-2 py-3 bg-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <span className="inline-block font-bold">{name}</span>
          <span className="ml-2 text-sm font-mono text-gray-500">{size.toLocaleString()} bytes</span>
        </div>
        <div>
          <select value={viewerType} onChange={e => setViewerType(e.target.value)}
            className="form-select block w-full pl-3 pr-10 py-2 text-base leading-6 border border-gray-300  rounded focus:outline-none focus:border-blue-500 sm:text-sm sm:leading-5">
            {viewers.map(d => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ErrorBoundary>
        <Viewer contents={code} />
      </ErrorBoundary>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log(error)
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

const viewers = [{
  id: "code",
  label: "Code",
  component: CodeViewer
}, {
  id: "flat",
  label: "Flat Data",
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
      return []
    }
  }, [contents]);
  console.log(data)

  return (
    <Grid data={data} />
  );
}