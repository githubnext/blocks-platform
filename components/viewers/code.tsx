import SyntaxHighlighter from "react-syntax-highlighter";
import { ViewerProps } from ".";

const disallowList = ["glb"];

export function CodeViewer(props: ViewerProps) {
  const { contents, meta } = props;
  const extension = meta.name.split(".").pop();

  if (disallowList.includes(extension)) {
    return (
      <div className="p-8 text-gray-500 text-sm">
        We can't display that file, sorry.
      </div>
    );
  }

  return (
    <div className={`text-sm code ${meta.theme}`}>
      <SyntaxHighlighter
        className="p-4"
        language={meta.language}
        useInlineStyles={false}
        showLineNumbers
        lineNumberStyle={{ opacity: 0.45 }}
      >
        {contents}
      </SyntaxHighlighter>
    </div>
  );
}
