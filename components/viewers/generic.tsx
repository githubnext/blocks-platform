import { SandpackRunner } from "@codesandbox/sandpack-react";
import "@codesandbox/sandpack-react/dist/index.css";
import { FormEventHandler, useState, useMemo } from "react";
import parseUrl from "parse-github-url";
import { ViewerProps } from ".";
import { DirectoryItem, RepoContext, useViewerTemplateContents } from "hooks";

interface GenericSandboxProps {
  tree: DirectoryItem[];
  originalContent: string;
  context: RepoContext;
}

function GenericSandbox(props: GenericSandboxProps) {
  const { tree, context, originalContent } = props;
  const meta = JSON.stringify(context);

  const pkgJson = tree.find((item) => item.name === "package.json");
  if (!pkgJson) throw new Error("No package.json found");

  const parsedPkgJson = JSON.parse(pkgJson.content);
  const { dependencies } = parsedPkgJson;

  const viewerSrc = tree.find(
    (item) => item.name.toLowerCase() === "viewer.tsx"
  );
  if (!viewerSrc) throw new Error("No viewer component found");

  const injectedSrc = `
    ${viewerSrc.content.replace(/\nexport/g, "\n// export")}

    export default function WrappedViewer() {
      return <Viewer meta={${meta}} content={${JSON.stringify(
    originalContent
  )}} />
    }
  `;

  const files = tree.reduce<Record<string, string>>((acc, item) => {
    if (item.path.startsWith("src")) {
      acc[item.path.replace("src", "")] = item.content;
    } else {
      acc[item.path] = item.content;
    }
    return acc;
  }, {});

  return (
    <SandpackRunner
      template="react"
      code={injectedSrc}
      customSetup={{
        dependencies,
        files,
      }}
    />
  );
}

export function GenericViewer({ contents, meta }: ViewerProps) {
  const [params, setParams] = useState<RepoContext>({
    repo: "",
    owner: "",
  });

  const { data, status } = useViewerTemplateContents(params, {
    enabled: Boolean(params.repo) && Boolean(params.owner),
  });

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const { url } = Object.fromEntries(form);
    const parsed = parseUrl(url);
    const { name: repo, owner } = parsed;
    setParams({ repo, owner });
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
            originalContent={contents}
            context={params}
            tree={data}
            //           meta={{
            // console.log(d);
            //             ...data[0],
            //             ...params,
            //           }}
            //           contents={contents}
            //           code={Buffer.from(data?.[0]?.content, "base64").toString()}
          />
        )}
      </div>
    </div>
  );
}
