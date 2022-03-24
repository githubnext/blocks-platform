import { RepoFiles } from "@githubnext/utils";
import { Octokit } from "@octokit/rest";
import { defaultBlocksRepo as exampleBlocksInfo } from "blocks/index";
import {
  Branch,
  createBranchAndPR,
  CreateBranchParams,
  CreateBranchResponse,
  getBranches,
  getFileContent,
  getFolderContent,
  getRepoFiles,
  getRepoInfoWithContributors,
  getRepoTimeline,
  RepoContext,
  RepoSearchResult,
  searchRepos,
} from "ghapi";
import { Base64 } from "js-base64";
import {
  BranchesKeyParams,
  FileKeyParams,
  FilesKeyParams,
  FolderKeyParams,
  GenericQueryKey,
  InfoKeyParams,
  QueryKeyMap,
  TimelineKeyParams,
} from "lib/query-keys";
import { isArray } from "lodash";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";

export function useFileContent(
  params: FileKeyParams,
  config?: UseQueryOptions<FileData>
) {
  const { repo, owner, path } = params;

  return useQuery<FileData, any, FileData, GenericQueryKey<FileKeyParams>>(
    QueryKeyMap.file.factory(params),
    getFileContent,
    {
      enabled: Boolean(repo) && Boolean(owner) && Boolean(path),
      refetchOnWindowFocus: false,
      retry: false,
      ...config,
    }
  );
}

export function useFolderContent(
  params: FolderKeyParams,
  config?: UseQueryOptions<FolderData>
) {
  return useQuery<
    FolderData,
    any,
    FolderData,
    GenericQueryKey<FolderKeyParams>
  >(QueryKeyMap.folder.factory(params), getFolderContent, {
    ...config,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

interface UseUpdateFileContentParams extends RepoContext {
  content: string;
  path: string;
  ref: string; // The name of the commit/branch/tag.
  branch: string; // Required in order to target createOrUpdateFileContents
  token?: string;
}

async function updateFileContents(params: UseUpdateFileContentParams) {
  const contentEncoded = Base64.encode(params.content);
  const octokit = new Octokit({
    auth: params.token,
  });

  const { data } = await octokit.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    ref: params.ref,
  });

  let fileSha;
  // Octokit is silly here and potentially returns an array of contents.
  if (isArray(data)) {
    fileSha = data[0].sha;
  } else {
    fileSha = data.sha;
  }

  try {
    const res = await octokit.repos.createOrUpdateFileContents({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      message: `feat: updated ${params.path} programatically`,
      content: contentEncoded,
      branch: params.branch,
      sha: fileSha,
    });
    return res.data.commit.sha;
  } catch (e) {}
}

export function useUpdateFileContents(
  config?: UseMutationOptions<any, any, UseUpdateFileContentParams>
) {
  return useMutation(updateFileContents, config);
}

export function useMetadata({
  owner,
  repo,
  metadataPath,
  filePath,
  token,
  branchName,
}: {
  owner: string;
  repo: string;
  metadataPath: string;
  filePath: string;
  token: string;
  branchName: string;
}) {
  const { data: metadataData } = useFileContent(
    {
      repo,
      owner,
      path: metadataPath,
      fileRef: branchName,
    },
    {
      refetchOnWindowFocus: false,
      useErrorBoundary: false,
    }
  );

  const [metadata, setMetadata] = useState<any>({});

  useEffect(() => {
    if (!metadataData) {
      setMetadata({});
      return;
    }
    try {
      const rawString = metadataData.content;
      const metadata = JSON.parse(rawString);
      setMetadata(metadata);
    } catch (e) {
      setMetadata({});
    }
  }, [metadataData, branchName]);

  const { mutateAsync } = useUpdateFileContents({});
  const onUpdateMetadata = useCallback(
    async (contents, overridePath = null) => {
      if (!token) return;
      await mutateAsync({
        content: JSON.stringify(contents, null, 2),
        owner,
        repo,
        path: overridePath || metadataPath,
        ref: branchName,
        branch: branchName,
        token,
      });
      setMetadata(contents);
    },
    [mutateAsync, owner, repo, metadataPath, filePath, token, branchName]
  );

  return {
    metadata,
    onUpdateMetadata,
  };
}

export function useRepoInfo(params: InfoKeyParams) {
  return useQuery<RepoInfo, any, RepoInfo, GenericQueryKey<InfoKeyParams>>(
    QueryKeyMap.info.factory(params),
    getRepoInfoWithContributors,
    {
      enabled: Boolean(params.repo) && Boolean(params.owner),
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

export function useRepoTimeline(
  params: TimelineKeyParams,
  config?: UseQueryOptions<RepoTimeline>
) {
  return useQuery<
    RepoTimeline,
    any,
    RepoTimeline,
    GenericQueryKey<TimelineKeyParams>
  >(QueryKeyMap.timeline.factory(params), getRepoTimeline, {
    cacheTime: 0,
    enabled: Boolean(params.repo) && Boolean(params.owner),
    refetchOnWindowFocus: false,
    retry: false,
    ...config,
  });
}

export function useRepoFiles(params: FilesKeyParams) {
  return useQuery<RepoFiles, any, RepoFiles, GenericQueryKey<FilesKeyParams>>(
    QueryKeyMap.files.factory(params),
    getRepoFiles,
    {
      enabled: Boolean(params.repo) && Boolean(params.owner),
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

export function useGetBranches(params: BranchesKeyParams) {
  return useQuery<Branch[], any, Branch[], GenericQueryKey<BranchesKeyParams>>(
    QueryKeyMap.branches.factory(params),
    getBranches,
    {
      enabled: Boolean(params.repo) && Boolean(params.owner),
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

export interface BlocksInfo {
  owner: string;
  repo: string;
  full_name: string;
  id: number;
  html_url: string;
  description: string;
  stars: number;
  watchers: number;
  language: string;
  topics: string[];
  blocks: Block[];
  release: {
    tag_name: string;
    name: string;
    tarball_url: string;
    zipball_url: string;
    published_at: string;
    browser_download_url: string;
  };
}

export function useGetBlocksInfo() {
  return useQuery<BlocksInfo[]>(
    QueryKeyMap.blocksInfo.factory(),
    () => {
      return blockz;
      const url = `${process.env.NEXT_PUBLIC_MARKETPLACE_URL}/api/blocks`;
      return fetch(url).then((res) => res.json());
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}

const defaultFileBlock = {
  id: "file-block",
  owner: "githubnext",
  repo: "blocks-examples",
} as Block;

const defaultFolderBlock = {
  id: "minimap-block",
  owner: "githubnext",
  repo: "blocks-examples",
} as Block;
export const getBlockKey = (block: Block) =>
  [block?.owner, block?.repo, block?.id || ""].join("__");
interface UseManageBlockParams {
  path: string;
  storedDefaultBlock: string;
  isFolder: boolean;
}
export function useManageBlock({
  path,
  storedDefaultBlock,
  isFolder,
}: UseManageBlockParams) {
  const router = useRouter();
  const { blockKey = "" } = router.query;

  // load list of example blocks
  const { data: allBlocksInfo = [] } = useGetBlocksInfo();
  const exampleBlocks = (exampleBlocksInfo?.blocks || []).map(
    (block) =>
      ({
        ...block,
        owner: exampleBlocksInfo.owner,
        repo: exampleBlocksInfo.repo,
      } as Block)
  );
  const extension = (path as string).split(".").slice(-1)[0];
  const relevantExampleBlocksInfo = exampleBlocks.filter(
    (d) =>
      d.type === (isFolder ? "folder" : "file") &&
      (!d.extensions ||
        d.extensions?.includes("*") ||
        d.extensions?.includes(extension))
  );

  // find default block
  const tryToGetBlockFromKey = (key = ""): Block | null => {
    let [blockOwner, blockRepo, blockId] = key.split("__");
    if (!blockOwner) blockOwner = defaultFileBlock.owner;
    if (!blockRepo) blockRepo = defaultFileBlock.repo;
    const isDefaultBlocksRepo =
      `${blockOwner}/${blockRepo}` ===
      `${defaultFileBlock.owner}/${defaultFileBlock.repo}`;
    if (isDefaultBlocksRepo)
      return relevantExampleBlocksInfo.find((b) => b.id === blockId);
    const customBlocksInfo = allBlocksInfo.find(
      (b) => b.owner === blockOwner && b.repo === blockRepo
    );
    const block = customBlocksInfo?.blocks.find((b) => b.id === blockId);
    if (!block) return null;
    if (isFolder !== (block.type === "folder")) return null;
    return {
      ...block,
      owner: customBlocksInfo.owner,
      repo: customBlocksInfo.repo,
    };
  };

  // first, default to block from url param
  const blockInUrl = tryToGetBlockFromKey(blockKey as string);
  const blockFromMetadata = tryToGetBlockFromKey(storedDefaultBlock);
  let fallbackDefaultBlock = overrideDefaultBlocks[extension]
    ? relevantExampleBlocksInfo.find(
        (b) => b.id === overrideDefaultBlocks[extension]
      )
    : // the first example block is always the code block,
      // so let's default to the second one, when available
      relevantExampleBlocksInfo[1] || relevantExampleBlocksInfo[0];

  if (
    !fallbackDefaultBlock ||
    isFolder !== (fallbackDefaultBlock.type === "folder")
  ) {
    fallbackDefaultBlock = isFolder ? defaultFolderBlock : defaultFileBlock;
  }

  const defaultBlock = blockFromMetadata || fallbackDefaultBlock;
  const block = blockInUrl || defaultBlock;

  let blockOptions = relevantExampleBlocksInfo;
  if (block && !blockOptions.some((b) => b.id === block.id)) {
    // If using a custom block, add it to the list
    blockOptions.push({ ...block, title: `Custom: ${block.title}` });
  }

  const setBlock = (block: Block) => {
    if (!block) return;
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        blockKey: getBlockKey(block),
      },
    });
  };

  return {
    block,
    setBlock,
    blockOptions: relevantExampleBlocksInfo,
    defaultBlock,
    allBlocksInfo,
  };
}
const overrideDefaultBlocks = {
  js: "code-block",
  ts: "code-block",
};

export function useCreateBranchAndPR(
  config?: UseMutationOptions<CreateBranchResponse, any, CreateBranchParams>
) {
  return useMutation(createBranchAndPR, config);
}

export function useSearchRepos(
  query: string,
  config?: UseQueryOptions<RepoSearchResult[]>
) {
  return useQuery<RepoSearchResult[], any, RepoSearchResult[]>(
    QueryKeyMap.searchRepos.factory(query),
    searchRepos,
    config
  );
}

export function useBlocks(path: string = "", type: "file" | "folder" = "file") {
  const { data: allBlockRepos = [] } = useGetBlocksInfo();

  const extension = path.split(".").pop();
  const filteredBlocks = useMemo(
    () =>
      allBlockRepos
        .map((repo) => {
          const filteredBlocks = repo.blocks.filter(
            (block: Block) =>
              // don't include example Blocks
              !["Example File Block", "Example Folder Block"].includes(
                block.title
              ) &&
              block.type === type &&
              (!block.extensions ||
                block.extensions?.includes("*") ||
                block.extensions?.includes(extension))
          );
          return {
            ...repo,
            blocks: filteredBlocks,
          };
        })
        .filter((repo) => repo?.blocks?.length),
    [allBlockRepos, extension]
  );

  return filteredBlocks;
}
const blockz = [
  {
    owner: "vtbassmatt",
    repo: "magic-block",
    full_name: "vtbassmatt/magic-block",
    id: 470648896,
    html_url: "https://github.com/vtbassmatt/magic-block",
    description: null,
    stars: 0,
    watchers: 0,
    language: "TypeScript",
    topics: ["github-blocks"],
    blocks: [
      {
        type: "file",
        id: "decklist-block",
        title: "Decklist Block",
        description: "Render a decklist",
        entry: "/src/blocks/decklist-block/index.tsx",
        extensions: ["txt", "md", "dec", "deck"],
        example_path:
          "https://github.com/vtbassmatt/magic-block/blob/main/examples/edhrec.txt",
      },
      {
        type: "file",
        id: "file-block",
        title: "Example File Block",
        description: "A basic file block",
        entry: "/src/blocks/example-file-block/index.tsx",
        extensions: ["*"],
        example_path:
          "https://github.com/facebook/react/blob/main/packages/react-dom/index.js",
      },
      {
        type: "folder",
        id: "folder-block",
        title: "Example Folder Block",
        description: "A basic folder block",
        entry: "/src/blocks/example-folder-block/index.tsx",
        extensions: ["*"],
        example_path: "https://github.com/githubocto/flat",
      },
    ],
    release: {
      tag_name: "0.2.0",
      name: "0.2.0",
      tarball_url:
        "https://api.github.com/repos/vtbassmatt/magic-block/tarball/0.2.0",
      zipball_url:
        "https://api.github.com/repos/vtbassmatt/magic-block/zipball/0.2.0",
      published_at: "2022-03-23T17:36:13Z",
      browser_download_url:
        "https://github.com/vtbassmatt/magic-block/releases/download/0.2.0/decklist-block.tar.gz",
    },
  },
  {
    owner: "githubnext",
    repo: "blocks-examples",
    full_name: "githubnext/blocks-examples",
    id: 426677638,
    html_url: "https://github.com/githubnext/blocks-examples",
    description: "A set of example custom Blocks.",
    stars: 6,
    watchers: 6,
    language: "TypeScript",
    topics: ["github-blocks"],
    blocks: [
      {
        type: "file",
        id: "code-block",
        title: "Code block",
        description: "A basic code block",
        sandbox: false,
        entry: "/src/blocks/file-blocks/code/index.tsx",
        extensions: ["*"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/Aside.jsx",
      },
      {
        type: "file",
        id: "excalidraw-block",
        title: "Drawing block",
        description: "A whiteboard tool",
        sandbox: false,
        entry: "/src/blocks/file-blocks/excalidraw/index.tsx",
        extensions: ["excalidraw"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/drawing.excalidraw",
      },
      {
        type: "file",
        id: "html-block",
        title: "HTML block",
        description: "View HTML content",
        sandbox: false,
        entry: "/src/blocks/file-blocks/html.tsx",
        extensions: ["html", "svelte"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/photos.html",
      },
      {
        type: "file",
        id: "css-block",
        title: "Styleguide block",
        description: "View selectors in a css file",
        sandbox: false,
        entry: "/src/blocks/file-blocks/css.tsx",
        extensions: ["css"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/global.css",
      },
      {
        type: "file",
        id: "image-block",
        title: "Image block",
        description: "View images",
        sandbox: false,
        entry: "/src/blocks/file-blocks/image.tsx",
        extensions: ["png", "jpg", "jpeg", "gif", "svg"],
        example_path:
          "https://github.com/pmndrs/react-spring/blob/HEAD/assets/projects/aragon.png?raw=true",
      },
      {
        type: "file",
        id: "json-block",
        title: "Object explorer",
        description: "An interactive view of JSON objects",
        sandbox: false,
        entry: "/src/blocks/file-blocks/json.tsx",
        extensions: ["json", "webmanifest", "prettierrc", "yaml", "yml"],
        example_path: "https://github.com/d3/d3-geo/blob/main/package.json",
      },
      {
        type: "file",
        id: "3d-model-block",
        title: "3D block",
        description: "A block for 3d files",
        sandbox: false,
        entry: "/src/blocks/file-blocks/3d-files.tsx",
        extensions: ["gltf", "glb"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/avocado.glb",
      },
      {
        type: "file",
        id: "flat-block",
        title: "Flat data block",
        description: "A block for flat data files",
        sandbox: false,
        entry: "/src/blocks/file-blocks/flat.tsx",
        extensions: ["csv"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/data.csv",
      },
      {
        type: "file",
        id: "simple-poll-block",
        title: "Poll block",
        description: "View simple polls beautifully",
        sandbox: false,
        entry: "/src/blocks/file-blocks/poll.tsx",
        extensions: ["json"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/poll.json",
      },
      {
        type: "file",
        id: "chart-block",
        title: "Chart block",
        description: "An interactive chart block",
        sandbox: false,
        entry: "/src/blocks/file-blocks/charts/index.tsx",
        extensions: ["csv"],
        example_path:
          "https://github.com/the-pudding/data/blob/master/pockets/measurements.csv",
      },
      {
        type: "file",
        id: "markdown-block",
        title: "Markdown",
        description:
          "View markdown files. You can also view live repo info, using Issues, Releases, and Commits custom components, as well as live code examples with CodeSandbox.",
        sandbox: true,
        entry: "/src/blocks/file-blocks/live-markdown/index.tsx",
        extensions: ["md", "mdx"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/README.md",
      },
      {
        type: "file",
        id: "react-feedback-block",
        title: "React component feedback",
        description: "Give feedback on a React component",
        sandbox: false,
        entry: "/src/blocks/file-blocks/annotate-react/index.tsx",
        extensions: ["jsx", "tsx"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/Aside.jsx",
      },
      {
        type: "file",
        id: "sentence-encoder-block",
        title: "Sentence encoder block",
        description: "Experiment with your sentence-encoder",
        sandbox: false,
        entry: "/src/blocks/file-blocks/sentence-encoder.tsx",
        extensions: ["json"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/queries.json",
      },
      {
        type: "file",
        id: "processing-block",
        title: "Processing block",
        description: "Run your p5.js sketches",
        sandbox: true,
        entry: "/src/blocks/file-blocks/processing.tsx",
        extensions: ["js"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/processing-sketch.js",
      },
      {
        type: "folder",
        id: "minimap-block",
        title: "Minimap",
        description: "A visualization of your folders and files",
        sandbox: false,
        entry: "/src/blocks/folder-blocks/minimap/index.tsx",
        example_path: "https://github.com/githubnext/blocks-tutorial",
      },
      {
        type: "folder",
        id: "dashboard-block",
        title: "Dashboard",
        description: "A dashboard of Blocks",
        sandbox: false,
        entry: "/src/blocks/folder-blocks/dashboard/index.tsx",
        example_path: "https://github.com/githubnext/blocks-tutorial",
      },
      {
        type: "folder",
        id: "code-tour-block",
        title: "Code Tour",
        description: "Create documented tours of your code",
        sandbox: false,
        entry: "/src/blocks/folder-blocks/code-tour/index.tsx",
        example_path: "https://github.com/githubnext/blocks-tutorial",
      },
    ],
    release: {
      tag_name: "0.9.4",
      name: "0.9.4",
      tarball_url:
        "https://api.github.com/repos/githubnext/blocks-examples/tarball/0.9.4",
      zipball_url:
        "https://api.github.com/repos/githubnext/blocks-examples/zipball/0.9.4",
      published_at: "2022-03-22T17:19:24Z",
      browser_download_url:
        "https://github.com/githubnext/blocks-examples/releases/download/0.9.4/3d-model-block.tar.gz",
    },
  },
  {
    owner: "githubnext",
    repo: "blocks-template",
    full_name: "githubnext/blocks-template",
    id: 425975468,
    html_url: "https://github.com/githubnext/blocks-template",
    description: "A template for creating custom Blocks.",
    stars: 6,
    watchers: 6,
    language: "TypeScript",
    topics: ["github-blocks"],
    blocks: [
      {
        type: "file",
        id: "file-block",
        title: "Example File Block",
        description: "A basic file block",
        entry: "/src/blocks/example-file-block/index.tsx",
        extensions: ["*"],
        example_path:
          "https://github.com/facebook/react/blob/main/packages/react-dom/index.js",
      },
      {
        type: "folder",
        id: "folder-block",
        title: "Example Folder Block",
        description: "A basic folder block",
        entry: "/src/blocks/example-folder-block/index.tsx",
        extensions: ["*"],
        example_path: "https://github.com/githubocto/flat",
      },
    ],
    release: {
      tag_name: "0.9.0",
      name: "0.9.0",
      tarball_url:
        "https://api.github.com/repos/githubnext/blocks-template/tarball/0.9.0",
      zipball_url:
        "https://api.github.com/repos/githubnext/blocks-template/zipball/0.9.0",
      published_at: "2021-12-01T17:48:49Z",
      browser_download_url:
        "https://github.com/githubnext/blocks-template/releases/download/0.9.0/file-block.tar.gz",
    },
  },
  {
    owner: "Wattenberger",
    repo: "blocks-primer-colors",
    full_name: "Wattenberger/blocks-primer-colors",
    id: 469952333,
    html_url: "https://github.com/Wattenberger/blocks-primer-colors",
    description: "A Block to view & edit GitHub Primer colors",
    stars: 2,
    watchers: 2,
    language: "TypeScript",
    topics: ["github-blocks"],
    blocks: [
      {
        type: "file",
        id: "file-block",
        title: "GitHub Primer Colors",
        description:
          "View and edit colors in the GitHub Primer primitives repo",
        entry: "/src/blocks/primer-colors.tsx",
        extensions: ["ts", "js"],
        example_path:
          "https://github.com/primer/primitives/blob/main/data/colors/themes/light.ts",
      },
    ],
    release: {
      tag_name: "0.0.2",
      name: "0.0.2",
      tarball_url:
        "https://api.github.com/repos/Wattenberger/blocks-primer-colors/tarball/0.0.2",
      zipball_url:
        "https://api.github.com/repos/Wattenberger/blocks-primer-colors/zipball/0.0.2",
      published_at: "2022-03-15T16:06:54Z",
      browser_download_url:
        "https://github.com/Wattenberger/blocks-primer-colors/releases/download/0.0.2/file-block.tar.gz",
    },
  },
  {
    owner: "Krzysztof-Cieslak",
    repo: "pathfinder-block",
    full_name: "Krzysztof-Cieslak/pathfinder-block",
    id: 467480681,
    html_url: "https://github.com/Krzysztof-Cieslak/pathfinder-block",
    description: null,
    stars: 0,
    watchers: 0,
    language: "TypeScript",
    topics: ["github-blocks"],
    blocks: [
      {
        type: "file",
        id: "pathfinder",
        title: "Pathfinder",
        description: "Block providing editor tooling based on the LSIF data",
        entry: "/src/blocks/pathfinder/index.tsx",
        extensions: ["*"],
        example_path: "",
      },
    ],
    release: {
      tag_name: "0.0.1",
      name: "0.0.1",
      tarball_url:
        "https://api.github.com/repos/Krzysztof-Cieslak/pathfinder-block/tarball/0.0.1",
      zipball_url:
        "https://api.github.com/repos/Krzysztof-Cieslak/pathfinder-block/zipball/0.0.1",
      published_at: "2022-03-08T15:55:22Z",
      browser_download_url:
        "https://github.com/Krzysztof-Cieslak/pathfinder-block/releases/download/0.0.1/pathfinder.tar.gz",
    },
  },
  {
    owner: "mattrothenberg",
    repo: "styleguide-block",
    full_name: "mattrothenberg/styleguide-block",
    id: 466106063,
    html_url: "https://github.com/mattrothenberg/styleguide-block",
    description: null,
    stars: 0,
    watchers: 0,
    language: "TypeScript",
    topics: ["github-blocks"],
    blocks: [
      {
        type: "file",
        id: "file-block",
        title: "Styleguide Block",
        description: "A proof-of-concept for living styleguides",
        entry: "/src/blocks/styleguide-block/index.tsx",
        extensions: ["*"],
        example_path:
          "https://github.com/mattrothenberg/styleguide-block-test/blob/main/index.css",
      },
    ],
    release: {
      tag_name: "0.2.0",
      name: "0.2.0",
      tarball_url:
        "https://api.github.com/repos/mattrothenberg/styleguide-block/tarball/0.2.0",
      zipball_url:
        "https://api.github.com/repos/mattrothenberg/styleguide-block/zipball/0.2.0",
      published_at: "2022-03-04T15:03:22Z",
      browser_download_url:
        "https://github.com/mattrothenberg/styleguide-block/releases/download/0.2.0/file-block.tar.gz",
    },
  },
  {
    owner: "jaked",
    repo: "rich-text-markdown-block",
    full_name: "jaked/rich-text-markdown-block",
    id: 465069429,
    html_url: "https://github.com/jaked/rich-text-markdown-block",
    description: "rich-text editor block that stores Markdown",
    stars: 0,
    watchers: 0,
    language: "TypeScript",
    topics: ["github-blocks"],
    blocks: [
      {
        type: "file",
        id: "rich-text-markdown-block",
        title: "Rich-text Markdown Editor Block",
        description: "A rich-text editor block that stores Markdown",
        entry: "/src/blocks/rich-text-markdown-block/index.tsx",
        extensions: ["md"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/README.md",
      },
    ],
    release: {
      tag_name: "0.0.2",
      name: "0.0.2",
      tarball_url:
        "https://api.github.com/repos/jaked/rich-text-markdown-block/tarball/0.0.2",
      zipball_url:
        "https://api.github.com/repos/jaked/rich-text-markdown-block/zipball/0.0.2",
      published_at: "2022-03-03T22:43:52Z",
      browser_download_url:
        "https://github.com/jaked/rich-text-markdown-block/releases/download/0.0.2/rich-text-markdown-block.tar.gz",
    },
  },
  {
    owner: "irealva",
    repo: "my-first-block",
    full_name: "irealva/my-first-block",
    id: 464987666,
    html_url: "https://github.com/irealva/my-first-block",
    description: null,
    stars: 0,
    watchers: 0,
    language: "TypeScript",
    topics: ["github-blocks"],
    blocks: [
      {
        type: "file",
        id: "csv-to-json",
        title: "Csv to Json converter",
        description: "A simple block to convert csv files to json",
        entry: "/src/blocks/csv-to-json/index.tsx",
        extensions: ["csv"],
        example_path:
          "https://github.com/githubnext/blocks-tutorial/blob/main/data.csv",
      },
    ],
    release: {
      tag_name: "0.0.1",
      name: "0.0.1",
      tarball_url:
        "https://api.github.com/repos/irealva/my-first-block/tarball/0.0.1",
      zipball_url:
        "https://api.github.com/repos/irealva/my-first-block/zipball/0.0.1",
      published_at: "2022-03-01T17:32:27Z",
      browser_download_url:
        "https://github.com/irealva/my-first-block/releases/download/0.0.1/csv-to-json.tar.gz",
    },
  },
  {
    owner: "jaked",
    repo: "mermaid-block",
    full_name: "jaked/mermaid-block",
    id: 459358837,
    html_url: "https://github.com/jaked/mermaid-block",
    description: null,
    stars: 0,
    watchers: 0,
    language: "TypeScript",
    topics: ["github-blocks"],
    blocks: [
      {
        type: "file",
        id: "file-block",
        title: "Example File Block",
        description: "A basic file block",
        entry: "/src/blocks/example-file-block/index.tsx",
        extensions: ["*"],
        example_path:
          "https://github.com/facebook/react/blob/main/packages/react-dom/index.js",
      },
      {
        type: "file",
        id: "mermaid-block",
        title: "Mermaid Block",
        description: "Render file with Mermaid",
        entry: "/src/blocks/mermaid-block/index.tsx",
        extensions: ["*"],
        example_path:
          "https://github.com/sourcegraph/sourcegraph/blob/main/doc/code_intelligence/explanations/diagrams/index-states.mermaid",
      },
      {
        type: "folder",
        id: "folder-block",
        title: "Example Folder Block",
        description: "A basic folder block",
        entry: "/src/blocks/example-folder-block/index.tsx",
        extensions: ["*"],
        example_path: "https://github.com/githubocto/flat",
      },
    ],
    release: {
      tag_name: "0.1.0",
      name: "0.1.0",
      tarball_url:
        "https://api.github.com/repos/jaked/mermaid-block/tarball/0.1.0",
      zipball_url:
        "https://api.github.com/repos/jaked/mermaid-block/zipball/0.1.0",
      published_at: "2022-02-17T05:06:29Z",
      browser_download_url:
        "https://github.com/jaked/mermaid-block/releases/download/0.1.0/file-block.tar.gz",
    },
  },
];
