interface FileContext {
  download_url: string;
  file: string;
  path: string;
  repo: string;
  owner: string;
  sha: string;
  username: string;
}

interface CommonViewerProps {
  metadata: any;
  onUpdateMetadata: () => any;
  onRequestUpdateContent: () => any;
}

interface FileData {
  content: string;
  context: FileContext;
}
type FileViewerProps = FileData & CommonViewerProps;

interface FolderContext {
  download_url: string;
  folder: string;
  path: string;
  repo: string;
  owner: string;
  sha: string;
  username: string;
}
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
