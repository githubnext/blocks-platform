import type { RepoFiles } from "@githubnext/blocks";
import { getNestedFileTree } from "@githubnext/blocks";
import {
  ChevronRightIcon,
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  FileIcon,
  SearchIcon,
} from "@primer/octicons-react";
import { ActionList, Box, StyledOcticon, Text, TextInput } from "@primer/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { VscCircleFilled, VscCircleOutline } from "react-icons/vsc";
import { FixedSizeTree as Tree } from "react-vtree";
import languageColors from "../language-colors.json";

// defined in @githubnext/blocks but not exported
interface NestedFileTree {
  children: NestedFileTree[];
  name: string;
  path: string;
  parent: string;
  size: number;
  type: string;
}

type User = {
  id: string;
  path: string;
};

type SidebarProps = {
  owner: string;
  repo: string;
  files: RepoFiles;
  activeFilePath: string;
  updatedContents: Record<string, unknown>;
};

const doShowPills = false;
export const Sidebar = ({
  owner = "",
  repo = "",
  files = [],
  activeFilePath = "",
  updatedContents,
}: SidebarProps) => {
  if (!files.map) return null;
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperElement = useRef<HTMLDivElement>(null);
  const tree = useRef<Tree>(null);
  const [dimensions, setDimensions] = useState<[number, number]>([100, 100]);

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
    if (tree.current) {
      setTimeout(() => {
        tree.current.scrollToItem(activeFilePath, "center");
      }, 100);
    }
  }, []);

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

  return (
    <Box className="sidebar h-full overflow-hidden flex-1">
      <Box className="p-2 pb-0">
        <TextInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search files & folders"
          leadingVisual={SearchIcon}
          className="w-full"
        />
      </Box>
      <Box className="h-full overflow-auto p-2 pt-0" ref={wrapperElement}>
        {filteredFiles.length > 0 ? (
          <ActionList className="">
            <Tree
              ref={tree}
              treeWalker={treeWalker}
              itemSize={30}
              height={dimensions[1]}
              width={dimensions[0]}
            >
              {Node}
            </Tree>
          </ActionList>
        ) : (
          <Text className="block text-sm text-center p-10 text-gray-500">
            No files found{searchTerm && ` for "${searchTerm}"`}
          </Text>
        )}
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
  },
  isOpen,
  style,
  toggle,
}) => {
  return (
    <div style={style}>
      <Item
        name={name}
        path={path}
        depth={depth}
        activeFilePath={activeFilePath}
        canCollapse={canCollapse}
        updatedContents={updatedContents}
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
  canCollapse?: boolean;
  isOpen: boolean;
  updatedContents: Record<string, unknown>;
  toggle: () => void;
};

const Item = (props: ItemProps) => {
  if (props.isFolder) {
    return <Folder {...props} />;
  }
  return <File {...props} isActive={props.activeFilePath === props.path} />;
};

type FolderProps = {
  name: string;
  path: string;
  depth: number;
  activeFilePath: string;
  canCollapse?: boolean;
  isOpen: boolean;
  updatedContents: Record<string, unknown>;
  toggle: () => void;
};

const Folder = ({
  name,
  path,
  activeFilePath,
  canCollapse = true,
  updatedContents,
  isOpen,
  depth,
  toggle,
}: FolderProps) => {
  const router = useRouter();
  const query = router.query;

  useEffect(() => {
    if (!isOpen && activeFilePath?.includes(name)) {
      toggle();
    }
  }, [activeFilePath]);

  const isActive = activeFilePath === path;

  return (
    <>
      <Link
        href={{
          pathname: router.pathname,
          query: {
            ...query,
            blockKey: isActive ? query.blockKey : undefined,
            path,
            fileRef: null,
          },
        }}
        shallow
      >
        <ActionList.LinkItem
          style={{ paddingLeft: depth * 13 }}
          sx={{
            "::before": {
              content: isActive ? "''" : null,
              background: "rgb(9, 105, 218)",
              borderRadius: "6px",
              width: "4px",
              height: "24px",
              position: "absolute",
              left: "-8px",
              top: 0,
              margin: "auto",
              bottom: 0,
            },
            position: "relative",
            width: "100%",
            fontWeight: 400,
          }}
          active={isActive}
          onClick={() => {
            // toggle();
          }}
        >
          <ActionList.LeadingVisual
            onClick={(e) => {
              // don't select the folder on toggle
              e.stopPropagation();
              e.preventDefault();
              toggle();
            }}
          >
            {depth > 0 && (
              <StyledOcticon
                sx={{ color: "fg.muted" }}
                className={`mr-[3px] ml-[-4px] transform transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
                icon={ChevronRightIcon}
              />
            )}
            <StyledOcticon
              sx={{ color: "#54aeff", ml: depth > 0 ? 0 : 2 }}
              icon={isOpen ? FileDirectoryOpenFillIcon : FileDirectoryFillIcon}
            />
          </ActionList.LeadingVisual>

          <div
            className={`flex items-center ${depth > 0 ? "ml-2" : "ml-1"}`}
            title={name}
          >
            <div className="whitespace-nowrap truncate">{name}</div>
            {/* using a div because ActionList.TrailingVisual messes up name truncation */}
            <div className="ml-auto">
              {!isOpen &&
                Object.keys(updatedContents).some((path2) =>
                  path2.startsWith(path)
                ) && <VscCircleOutline />}
            </div>
          </div>
        </ActionList.LinkItem>
      </Link>

      {isOpen && (
        <ActionList
          data-depth={depth}
          className="!py-0 relative"
          sx={{
            // pl: depth ? 2 : 0,
            "::before": {
              content: depth === 0 ? null : "''",
              position: "absolute",
              // Magic number. Seems to achieve the right spacing for optical alignment between the chevron and the vertical line.
              left: 7 + depth * 13,
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(208, 215, 222, 0.48)",
            },
          }}
        ></ActionList>
      )}
    </>
  );
};

type FileProps = {
  name: string;
  path: string;
  depth: number;
  isActive: boolean;
  updatedContents: Record<string, unknown>;
};

const File = ({ name, path, isActive, updatedContents, depth }: FileProps) => {
  const router = useRouter();
  const query = router.query;

  return (
    <Link
      shallow
      href={{
        pathname: router.pathname,
        query: {
          ...query,
          blockKey: isActive ? query.blockKey : undefined,
          path,
          fileRef: null,
        },
      }}
    >
      <ActionList.LinkItem
        sx={{
          "::before": {
            content: isActive ? "''" : null,
            background: "rgb(9, 105, 218)",
            borderRadius: "6px",
            width: "4px",
            height: "24px",
            position: "absolute",
            left: "-8px",
            top: 0,
            margin: "auto",
            bottom: 0,
          },
          position: "relative",
          width: "100%",
          paddingLeft: depth * 13,
          fontWeight: 400,
        }}
        active={isActive}
      >
        <ActionList.LeadingVisual>
          <StyledOcticon icon={FileIcon} sx={{ ml: 3 }} />
        </ActionList.LeadingVisual>
        <div className="flex items-center ml-2" title={name}>
          <div title={name} className="whitespace-nowrap truncate">
            {name}
          </div>
          {/* using a div because ActionList.TrailingVisual messes up name truncation */}
          <div className="ml-auto">
            {updatedContents[path] && <VscCircleFilled />}
          </div>
        </div>
      </ActionList.LinkItem>
    </Link>
  );
};

type FileDotProps = {
  name: string;
  type?: "file" | "folder";
};

const FileDot = ({ name, type = "file" }: FileDotProps) => {
  if (!doShowPills) return null;

  const extension = name.split(".").pop();
  let color = languageColors[extension] || "#dadada";
  if (type === "folder") {
    color = "transparent";
  }

  return (
    <div
      className={`h-[0.8em] w-[0.5em] rounded-full border-[1px] ${
        type === "folder" ? "border-gray-400" : "border-transparent"
      }`}
      style={{ background: color }}
    />
  );
};
