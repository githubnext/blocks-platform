import { RepoContext } from "api";
import { useFileContent } from "hooks";
import { Session } from "node_modules/next-auth";

interface SandboxedFileViewerProps {
  viewer: Viewer;
  viewerContext: RepoContext;
  contents: string;
  metadata: any;
  meta: {
    language: string;
    theme: string;
    name: string;
    download_url: string;
    repo: string;
    owner: string;
    path: string;
    sha: string;
    username: string;
  };
  onUpdateMetaData: () => Promise<void>;
  session: Session;
}

export function SandboxedFileViewer(props: SandboxedFileViewerProps) {
  const { viewer, viewerContext, meta } = props;
  const { repo, owner, path } = meta;

  console.log(viewer, viewerContext, meta);

  const { data, status } = useFileContent({
    repo: viewerContext.repo,
    owner: viewerContext.owner,
    path: viewer.entry,
    fileRef: "",
    token: "",
  });

  return <div>Sandboxed</div>;

  // if (status === "loading") return <div className="p-4">Loading...</div>;
  // if (status === "error") return <div className="p-4">Error...</div>;

  // if (status === "success" && data) {
  //   const injectedSource = `
  //     ${data.source}
  //     export default function WrappedViewer() {
  //       return <Viewer context={${JSON.stringify(
  //         context
  //       )}} content={${JSON.stringify(content)}} />
  //     }
  //   `;

  //   return (
  //     <div className="flex-1 h-full sandbox-wrapper">
  //       <SandpackRunner
  //         template="react"
  //         code={injectedSource}
  //         customSetup={{
  //           dependencies: data.dependencies,
  //           files: data.files,
  //         }}
  //         options={{
  //           showNavigator: false,
  //         }}
  //       />
  //     </div>
  //   );
  // }

  return null;
}
