type schemas = import("@octokit/openapi-types").components["schemas"];

interface CommonBlockProps {
  metadata: any;
  onUpdateMetadata: () => any;
  onUpdateContent: () => any;
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

type DirectoryItem = schemas["content-directory"][number];
type TreeItem = schemas["git-tree"]["tree"][number];

type RepoItem = schemas["repo-search-result-item"];

type Contributor = schemas["contributor"];
type Branch = schemas["short-branch"];
type RepoInfo = schemas["repository"] & {
  contributors: Contributor[];
};

type Commit = schemas["commit"];
type CommitBrief = {
  date: Commit["commit"]["author"]["date"];
  username: Commit["author"]["login"];
  message: Commit["commit"]["message"];
  url: Commit["html_url"];
  sha: Commit["sha"];
};

type RepoTimeline = CommitBrief[];

interface User {
  name: string;
  image: string;
}

interface Session {
  token: string;
  user: User;
  expires: string;
}
