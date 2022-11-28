import type { RepoFiles } from "@githubnext/blocks";
import { getNestedFileTree } from "@githubnext/blocks";
import {
  ChevronRightIcon,
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  FileIcon,
  SearchIcon,
} from "@primer/octicons-react";
import { Box, StyledOcticon, Text, TextInput } from "@primer/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { VscCircleOutline } from "react-icons/vsc";
import { FixedSizeTree as Tree } from "react-vtree";

// defined in @githubnext/blocks but not exported
interface NestedFileTree {
  children: NestedFileTree[];
  name: string;
  path: string;
  parent: string;
  size: number;
  type: string;
}

type SidebarProps = {
  owner: string;
  repo: string;
  files: RepoFiles;
  activeFilePath: string;
  updatedContents: Record<string, unknown>;
};

export const Sidebar = ({
  owner = "",
  repo = "",
  files = [],
  activeFilePath = "",
  updatedContents,
}: SidebarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperElement = useRef<HTMLDivElement>(null);
  const tree = useRef<Tree>(null);
  const [dimensions, setDimensions] = useState<[number, number]>([100, 100]);
  const router = useRouter();
  const query = router.query;

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
  }, []);
  useEffect(() => {
    if (!tree.current) return;
    tree.current.recomputeTree({
      useDefaultOpenness: true,
    });
  }, [searchTerm]);

  const nestedFiles = useMemo(() => {
    try {
      return getNestedFileTree(files)?.[0]?.children || [];
    } catch (e) {}
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return nestedFiles;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return nestedFiles
      .map((file) => {
        const children = file.children.filter((child) =>
          child.name.toLowerCase().includes(lowerSearchTerm)
        );
        const isMatch = file.name.toLowerCase().includes(lowerSearchTerm);
        if (!children.length && !isMatch) return null;
        return { ...file, children };
      })
      .filter(Boolean) as NestedFileTree[];
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

  const treeWalker = useMemo(
    () =>
      function* treeWalker(refresh) {
        const stack = [];

        // Remember all the necessary data of the first node in the stack.
        stack.push({
          depth: 0,
          node: {
            id: "/",
            name: `${owner}/${repo}`,
            path: "",
            children: filteredFiles,
          },
        });

        // Walk through the tree until we have no nodes available.
        while (stack.length !== 0) {
          const {
            node: { children = [], path, name },
            depth,
          } = stack.pop();
          const canCollapse = depth > 0;
          const id = path || "/";

          // Here we are sending the information about the node to the Tree component
          // and receive an information about the openness state from it. The
          // `refresh` parameter tells us if the full update of the tree is requested;
          // basing on it we decide to return the full node data or only the node
          // id to update the nodes order.
          const isOpened = yield refresh
            ? {
                id,
                isLeaf: children.length === 0,
                isOpenByDefault: numberOfFiles < 20 || depth < 1,
                name,
                depth,
                path,
                activeFilePath,
                canCollapse,
                updatedContents,
                currentPathname: router.pathname,
                currentQuery: query,
              }
            : id;

          // Basing on the node openness state we are deciding if we need to render
          // the child nodes (if they exist).
          if (children.length !== 0 && isOpened) {
            // Since it is a stack structure, we need to put nodes we want to render
            // first to the end of the stack.
            for (let i = children.length - 1; i >= 0; i--) {
              stack.push({
                depth: depth + 1,
                node: children[i],
              });
            }
          }
        }
      },
    [filteredFiles, updatedContents, numberOfFiles < 20, activeFilePath]
  );
  if (!files.map) return null;

  return (
    <Box className="sidebar flex flex-col h-full overflow-hidden flex-1 w-[17rem]">
      <Box className="p-2 pb-0">
        <TextInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search files & folders"
          leadingVisual={SearchIcon}
          className="w-full"
        />
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
    isLeaf,
    name,
    path,
    activeFilePath,
    depth,
    canCollapse,
    updatedContents,
    currentPathname,
    currentQuery,
  },
  isOpen,
  style,
  toggle,
}) => {
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
        toggle={toggle}
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
  canCollapse?: boolean;
  isOpen: boolean;
  updatedContents: Record<string, unknown>;
  toggle: () => void;
};

const Item = ({
  name,
  path,
  isFolder,
  activeFilePath,
  depth,
  currentPathname,
  currentQuery,
  isOpen,
  updatedContents,
  toggle,
}: ItemProps) => {
  const isActive = activeFilePath === path;
  const { owner: _owner, repo: _repo, path: _path, ...query } = currentQuery;
  const linkUrlParams = new URLSearchParams(query);

  return (
    <Link
      href={{
        pathname: currentPathname,
        query: {
          ...currentQuery,
          path,
          blockKey: isActive ? currentQuery.blockKey : undefined,
          fileRef: null,
        },
      }}
      // some strange nextjs hackery to keep the path unencoded
      as={`/${currentQuery.owner}/${
        currentQuery.repo
      }/${path}?${linkUrlParams.toString()}`}
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
              toggle();
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
