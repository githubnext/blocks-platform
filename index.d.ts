interface CommonBlockProps {
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
type FileBlockProps = FileData & CommonBlockProps;

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
type FolderBlockProps = FolderData & CommonBlockProps;

type DirectoryItem =
  import("@octokit/openapi-types").components["schemas"]["content-directory"][number];
type TreeItem =
  import("@octokit/openapi-types").components["schemas"]["git-tree"]["tree"][number];

type RepoItem =
  import("@octokit/openapi-types").components["schemas"]["repo-search-result-item"];

interface RepoInfo {
  repoInfo: any;
  activity: any;
  commits: any;
  fileChanges: any;
}

interface Block {
  type: string;
  title: string;
  description: string;
  entry: string;
  extensions?: string[];
}

interface User {
  name: string;
  image: string;
}

interface Session {
  token: string;
  user: User;
  expires: string;
}
