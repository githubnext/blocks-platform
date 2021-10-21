import SyntaxHighlighter from "react-syntax-highlighter";
import { ViewerProps } from ".";

export function CodeViewer(props: ViewerProps) {
  const { contents, meta } = props;
  return (
    <div className={`text-sm code ${meta.theme}`}>
      <SyntaxHighlighter
        className="p-4"
        language={meta.language}
        useInlineStyles={false}
      >
        {contents}
      </SyntaxHighlighter>
    </div>
  );
}
