import { SandpackRunner } from "@codesandbox/sandpack-react";
import "@codesandbox/sandpack-react/dist/index.css";
import { RepoContext, RepoFiles } from "api";
import { useFileContent, useViewerContentAndDependencies } from "hooks";
import { useMemo } from "react";
import { Session } from "node_modules/next-auth";

interface SandboxedFileViewerProps {
  viewer: Viewer;
  viewerContext: RepoContext;
  contents?: string;
  tree?: RepoFiles;
  metadata: any;
  meta: {
    language?: string;
    theme: string;
    name: string;
    download_url: string;
    repo: string;
    owner: string;
    path: string;
    sha: string;
    username: string;
  };
  dependencies: Record<string, string>;
  onUpdateMetaData: () => Promise<void>;
  session: Session;
}

export function SandboxedFileViewer(props: SandboxedFileViewerProps) {
  const { viewer, viewerContext, contents, tree, dependencies, meta } = props;
  const { repo, owner, path } = meta;

  const params = useMemo(() => ({
    repo: viewerContext.repo,
    owner: viewerContext.owner,
    path: "src" + viewer.entry,
    fileRef: "main",
    token: "",
  }), [viewerContext.repo, viewerContext.owner, viewer.entry])
  const { data, status } = useViewerContentAndDependencies(params);

  const [viewerContent, ...otherFiles] = data || []
  const rootPath = "src" + (viewer.entry || "").split("/").slice(0, -1).join("/")
  const otherFilesMap = useMemo(() => {
    return otherFiles.reduce<Record<string, string>>((acc, file) => {
      const relativePath = file.context.path.replace(rootPath, "")
      acc[relativePath] = file.content;
      return acc;
    }, {})
  }, [otherFiles])

  const relevantDependencies = useMemo(() => {
    if (!data) return {}
    const allDependencyNames = Object.keys(dependencies)
    const allFileContents = data.map(d => d.content).join("/n")
    const relevantDependencyNames = allDependencyNames.filter(d => allFileContents.includes(d))
    return relevantDependencyNames.reduce<Record<string, string>>((acc, d) => {
      acc[d] = dependencies[d]
      return acc;
    }, {})
  }, [data])

  if (!viewerContent?.content) return <div className="p-4">Loading...</div>;

  if (status === "loading") return <div className="p-4">Loading...</div>;
  if (status === "error") return <div className="p-4">Error...</div>;

  if (!contents && !tree) return null

  if (status === "success" && data) {
    const injectedSource = `
      ${viewerContent.content}
      export default function WrappedViewer() {
        return <Viewer context={${JSON.stringify(
      viewerContent.context
    )}} content={${JSON.stringify(contents)}} tree={${JSON.stringify(tree)}} />
      }
    `;


    return (
      <div className="flex-1 h-full sandbox-wrapper">
        <SandpackRunner
          template="react"
          code={injectedSource}
          customSetup={{
            dependencies: relevantDependencies,
            files: otherFilesMap,
          }}
          options={{
            showNavigator: false,
          }}
        />
      </div>
    );
  }
}
