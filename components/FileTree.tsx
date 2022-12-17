import type { RepoFiles } from "@githubnext/blocks";
import { getNestedFileTree } from "@githubnext/blocks";
import {
  ChevronRightIcon,
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  FileIcon,
  SearchIcon,
  SidebarExpandIcon,
} from "@primer/octicons-react";
import { Box, IconButton, StyledOcticon, Text, TextInput } from "@primer/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { VscCircleOutline } from "react-icons/vsc";
import type { FixedSizeNodeData, FixedSizeNodePublicState } from "react-vtree";
import { FixedSizeTree as Tree } from "react-vtree";
import { Tooltip } from "./Tooltip";
import makeBranchPath from "utils/makeBranchPath";
import { useFileTreePane } from "state";

type TreeData = {
  id: string;
  isLeaf: boolean;
  isOpenByDefault: boolean;
  name: string;
  depth: number;
  path: string;
  activeFilePath: string;
  canCollapse: boolean;
  updatedContents: Record<string, unknown>;
  currentPathname: string;
  currentQuery: Record<string, string | string[]>;
  currentBranch: string;
} & FixedSizeNodeData;

type NodeData = {
  nestingLevel: number;
  node: NestedFileTree;
  data: TreeData;
};

// defined in @githubnext/blocks but not exported
interface NestedFileTree {
  children: NestedFileTree[];
  name: string;
  path: string;
  parent: string;
  size: number;
  type: string;
}

type FileTreeProps = {
  owner: string;
  repo: string;
  branchName: string;
  files: RepoFiles;
  activeFilePath: string;
  updatedContents: Record<string, unknown>;
};

export const FileTree = ({
  owner = "",
  repo = "",
  branchName,
  files = [],
  activeFilePath = "",
  updatedContents,
}: FileTreeProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperElement = useRef<HTMLDivElement>(null);
  const tree = useRef<Tree>(null);
  const [dimensions, setDimensions] = useState<[number, number]>([100, 100]);
  const router = useRouter();
  const query = router.query;
  const { toggle: toggleFileTree } = useFileTreePane();

  useEffect(() => {
    const onResize = () => {
      if (wrapperElement.current) {
        const { width, height } =
          wrapperElement.current.getBoundingClientRect();
        setDimensions([width, height]);
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if (!tree.current) return;
      tree.current.scrollToItem(activeFilePath, "center");
    }, 100);
  }, [activeFilePath]);

  const nestedFiles = useMemo(() => {
    try {
      return getNestedFileTree(files)?.[0]?.children || [];
    } catch (e) {}
  }, [files]);

  const filteredFiles = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return [
      {
        name: `${owner}/${repo}`,
        path: "",
        children: !searchTerm
          ? nestedFiles
          : (nestedFiles
              .map((file) => {
                const children = file.children.filter((child) =>
                  child.name.toLowerCase().includes(lowerSearchTerm)
                );
                const isMatch = file.name
                  .toLowerCase()
                  .includes(lowerSearchTerm);
                if (!children.length && !isMatch) return null;
                return { ...file, children };
              })
              .filter(Boolean) as NestedFileTree[]),
      },
    ];
  }, [nestedFiles, searchTerm]);

  const numberOfFiles = useMemo(() => {
    let runningCount = 0;
    const countFiles = (file: NestedFileTree) => {
      runningCount++;
      file.children.forEach(countFiles);
    };
    filteredFiles.forEach(countFiles);
    return runningCount;
  }, [filteredFiles]);

  // This function prepares an object for yielding. We can yield an object
  // that has `data` object with `id` and `isOpenByDefault` fields.
  // We can also add any other data here.
  const getNodeData = (node, nestingLevel): NodeData => {
    const id = node.path || "/";
    // don't close open folders
    const existingIsOpen = tree.current?.state.records.get(id)?.public.isOpen;
    return {
      data: {
        id,
        isLeaf: node.children?.length === 0,
        isOpenByDefault:
          existingIsOpen ||
          activeFilePath === id ||
          activeFilePath.startsWith(`${id}/`) ||
          numberOfFiles < 20 ||
          nestingLevel < 1,
        name: node.name,
        depth: nestingLevel,
        path: node.path,
        activeFilePath,
        canCollapse: nestingLevel > 0,
        updatedContents,
        currentPathname: router.pathname,
        currentQuery: query,
        currentBranch: branchName,
      },
      nestingLevel,
      node,
    };
  };

  function* treeWalker(): Generator<NodeData, undefined, NodeData> {
    // Step [1]: Define the root node of our tree. There can be one or
    // multiple nodes.
    for (let i = 0; i < filteredFiles.length; i++) {
      yield getNodeData(filteredFiles[i], 0);
    }

    while (true) {
      // Step [2]: Get the parent component back. It will be the object
      // the `getNodeData` function constructed, so you can read any data from it.
      const parent = yield;

      for (let i = 0; i < parent.node.children.length; i++) {
        // Step [3]: Yielding all the children of the provided component. Then we
        // will return for the step [2] with the first children.
        yield getNodeData(parent.node.children[i], parent.nestingLevel + 1);
      }
    }
  }

  if (!files.map) return null;

  return (
    <Box className="sidebar flex flex-col h-full overflow-hidden flex-1">
      <Box
        bg="canvas.subtle"
        p={2}
        className="h-panelHeader"
        borderBottom="1px solid"
        borderColor="border.muted"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <TextInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search files & folders"
          leadingVisual={SearchIcon}
          className="w-full"
        />
        <Tooltip placement="top-end" label="Close File Tree">
          <IconButton
            icon={SidebarExpandIcon}
            onClick={toggleFileTree}
            sx={{ ml: 2 }}
            title={"Close sidebar"}
          />
        </Tooltip>
      </Box>

      <Box className="flex-1 overflow-auto">
        <div className="h-full w-full file-tree-wrapper" ref={wrapperElement}>
          {filteredFiles.length > 0 ? (
            <Tree
              treeWalker={treeWalker}
              itemSize={32}
              height={dimensions[1]}
              width={dimensions[0]}
              className="pb-10"
              ref={tree}
            >
              {Node}
            </Tree>
          ) : (
            <Text className="block text-sm text-center p-10 text-gray-500">
              No files found{searchTerm && ` for "${searchTerm}"`}
            </Text>
          )}
        </div>
      </Box>
    </Box>
  );
};

const Node = ({
  data: {
    name,
    path,
    activeFilePath,
    depth,
    canCollapse,
    updatedContents,
    currentPathname,
    currentQuery,
    currentBranch,
    isLeaf,
  },
  isOpen,
  style,
  setOpen,
}: FixedSizeNodePublicState<TreeData> & { style: CSSProperties }) => {
  return (
    <div style={style} key={path || "/"}>
      <Item
        name={name}
        path={path}
        depth={depth}
        activeFilePath={activeFilePath}
        canCollapse={canCollapse}
        updatedContents={updatedContents}
        currentPathname={currentPathname}
        currentQuery={currentQuery}
        currentBranch={currentBranch}
        setOpen={setOpen}
        isOpen={isOpen}
        isFolder={!isLeaf}
      />
    </div>
  );
};

type ItemProps = {
  name: string;
  path: string;
  isFolder: boolean;
  activeFilePath: string;
  depth: number;
  currentPathname: string;
  currentQuery: Record<string, any>;
  currentBranch: string;
  canCollapse?: boolean;
  isOpen: boolean;
  updatedContents: Record<string, unknown>;
  setOpen: (newState: boolean) => void;
};

const Item = ({
  name,
  path,
  isFolder,
  activeFilePath,
  depth,
  currentPathname,
  currentQuery,
  currentBranch,
  isOpen,
  updatedContents,
  setOpen,
}: ItemProps) => {
  const isActive = activeFilePath === path;

  return (
    <Link
      href={{
        pathname: currentPathname,
        query: {
          ...currentQuery,
          branchPath: makeBranchPath(currentBranch, path),
          blockKey: isActive ? currentQuery.blockKey : undefined,
          fileRef: null,
        },
      }}
      shallow
    >
      <a
        style={{ paddingLeft: depth * 13 }}
        className={`relative ml-3 w-[calc(100%-12px)] flex items-center px-[8px] py-[6px] rounded-md hover:z-10 ${
          isActive ? "bg-[#F4F5F7]" : "bg-white hover:bg-[#F0F2F4]"
        }`}
      >
        {isActive && (
          <div className="absolute top-[calc(50%-12px)] left-[-8px] w-[4px] h-[24px] bg-[rgb(9,105,218)] rounded-[6px]" />
        )}
        {isFolder ? (
          <button
            className="flex-none"
            onClick={(e) => {
              // don't select the folder on toggle
              e.stopPropagation();
              e.preventDefault();
              setOpen(!isOpen);
            }}
          >
            {depth > 0 && (
              <StyledOcticon
                color="fg.muted"
                className={`mr-[6px] ml-[-8px] transform transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
                icon={ChevronRightIcon}
              />
            )}
            <StyledOcticon
              color="#54aeff"
              sx={{ ml: depth > 0 ? 0 : 2 }}
              icon={isOpen ? FileDirectoryOpenFillIcon : FileDirectoryFillIcon}
            />
          </button>
        ) : (
          <StyledOcticon icon={FileIcon} className="ml-4 text-[#57606a]" />
        )}

        <div className={`flex items-center ml-2 overflow-hidden`} title={name}>
          <div className="whitespace-nowrap truncate text-[#24292f] text-sm">
            {name}
          </div>
          <div className="ml-auto">
            {!isOpen &&
              Object.keys(updatedContents).some((path2) =>
                path2.startsWith(path)
              ) && <VscCircleOutline />}
          </div>
        </div>
      </a>
    </Link>
  );
};
