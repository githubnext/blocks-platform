interface CommonViewerProps {
  metadata: any;
  onUpdateMetadata: () => any;
  onRequestUpdateContent: () => any;
}

interface Session {
  token: string;
}

interface FileData {
  content: string;
  context: FileContext;
}
type FileViewerProps = FileData & CommonViewerProps;

interface FolderData {
  tree: {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
  }[];
  context: FolderContext;
}
type FolderViewerProps = FolderData & CommonViewerProps;

type DirectoryItem =
  import("@octokit/openapi-types").components["schemas"]["content-directory"][number];
type TreeItem =
  import("@octokit/openapi-types").components["schemas"]["git-tree"]["tree"][number];

interface RepoInfo {
  repoInfo: any;
  activity: any;
  commits: any;
  fileChanges: any;
}

interface Viewer {
  type: string;
  title: string;
  description: string;
  entry: string;
  extensions?: string[];
}
