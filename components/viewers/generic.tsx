import { SandpackRunner } from "@codesandbox/sandpack-react";
import "@codesandbox/sandpack-react/dist/index.css";
import { FormEventHandler, useState, useMemo } from "react";
import parseUrl from "parse-github-url";
import { ViewerProps } from ".";
import { useFileContent, UseFileContentParams } from "hooks";

interface GenericSandboxProps {
  code: string;
  meta: any;
  contents: string;
}

function GenericSandbox(props: GenericSandboxProps) {
  const { code, meta, contents } = props;

  // TODO: get dependencies from code
  const dependencies = useMemo(() => {
    try {
      const depRegex = new RegExp(/dependencies = {(.*)}/gi);
      const match = depRegex.exec(code);
      const dependencies = match[1].replace(/'/g, '"');
      return JSON.parse(`{${dependencies}}`);
    } catch (e) {
      return {};
    }
  }, [code]);

  const injectedCode = `
    ${code.replace(/\nexport/g, "\n// export")}

    export default function WrappedViewer() {
      return <Viewer content={${JSON.stringify(
        contents
      )}} meta={${JSON.stringify(meta)}} />
    }
  `;

  return (
    <SandpackRunner
      template="react"
      code={injectedCode}
      customSetup={{
        dependencies,
        // Get the working tree of whatever directory the viewer lives in
        files: {
          "/style.css": `body { color: blue; }`,
        },
      }}
    />
  );
}

export function GenericViewer({ contents, meta }: ViewerProps) {
  const [params, setParams] = useState<UseFileContentParams>({
    repo: "",
    owner: "",
    path: "",
    fileRef: "",
  });

  const { data, status } = useFileContent(params, {
    enabled:
      Boolean(params.repo) && Boolean(params.owner) && Boolean(params.path),
  });

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const { url } = Object.fromEntries(form);
    const parsed = parseUrl(url);
    const { name: repo, owner, filepath: path, branch } = parsed;
    setParams({ repo, owner, path, fileRef: branch });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-gray-50 flex-shrink-0">
        <form onSubmit={handleSubmit} action="">
          <input
            className="form-input w-full text-sm"
            name="url"
            type="url"
            required
            placeholder="Enter file URL"
          />
        </form>
      </div>
      <div className="flex-1 p-4">
        {status === "loading" && <p>Loading viewer...</p>}
        {status === "success" && data && (
          <GenericSandbox
            meta={{
              ...data[0],
              ...params,
            }}
            contents={contents}
            code={Buffer.from(data?.[0]?.content, "base64").toString()}
          />
        )}
      </div>
    </div>
  );
}
