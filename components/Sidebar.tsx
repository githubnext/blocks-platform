import type { RepoFiles } from "@githubnext/blocks";
import { getNestedFileTree } from "@githubnext/blocks";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  FileIcon,
} from "@primer/octicons-react";
import { ActionList, Box, StyledOcticon } from "@primer/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { VscCircleFilled, VscCircleOutline } from "react-icons/vsc";
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

  const nestedFiles = useMemo(() => {
    try {
      return getNestedFileTree(files)?.[0]?.children || [];
    } catch (e) {}
  }, [files]);

  return (
    <Box className="sidebar h-full overflow-hidden flex-1">
      <Box className="h-full overflow-auto p-2">
        <ActionList>
          <Item
            name={`${owner}/${repo}`}
            path={""}
            depth={-1}
            children={nestedFiles}
            activeFilePath={activeFilePath}
            canCollapse={false}
            updatedContents={updatedContents}
          />
        </ActionList>
      </Box>
    </Box>
  );
};

type ItemProps = {
  name: string;
  path: string;
  children: NestedFileTree[];
  activeFilePath: string;
  depth: number;
  canCollapse?: boolean;
  updatedContents: Record<string, unknown>;
};

const Item = (props: ItemProps) => {
  if (props.children.length) {
    return <Folder {...props} depth={props.depth + 1} />;
  }
  return (
    <File
      {...props}
      depth={props.depth + 1}
      isActive={props.activeFilePath === props.path}
    />
  );
};

type FolderProps = {
  name: string;
  path: string;
  depth: number;
  children: NestedFileTree[];
  activeFilePath: string;
  canCollapse?: boolean;
  updatedContents: Record<string, unknown>;
};

const Folder = ({
  name,
  path,
  children,
  activeFilePath,
  canCollapse = true,
  updatedContents,
  depth,
}: FolderProps) => {
  const [isExpanded, setIsExpanded] = useState(!canCollapse);
  const router = useRouter();
  const query = router.query;

  useEffect(() => {
    if (!isExpanded && activeFilePath?.includes(name)) {
      setIsExpanded(true);
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
            if (!canCollapse) return;
            setIsExpanded(!isExpanded);
          }}
        >
          <ActionList.LeadingVisual
            onClick={(e) => {
              // don't select the folder on toggle
              e.stopPropagation();
              e.preventDefault();
              if (!canCollapse) return;
              setIsExpanded(!isExpanded);
            }}
          >
            {depth > 0 && (
              <StyledOcticon
                sx={{ color: "fg.muted" }}
                className="mr-[3px] ml-[-4px]"
                icon={isExpanded ? ChevronDownIcon : ChevronRightIcon}
              />
            )}
            <StyledOcticon
              sx={{ color: "#54aeff", ml: depth > 0 ? 0 : 2 }}
              icon={
                isExpanded ? FileDirectoryOpenFillIcon : FileDirectoryFillIcon
              }
            />
          </ActionList.LeadingVisual>

          <div
            className={`flex items-center ${depth > 0 ? "ml-2" : "ml-1"}`}
            title={name}
          >
            <div className="whitespace-nowrap truncate">{name}</div>
            {/* using a div because ActionList.TrailingVisual messes up name truncation */}
            <div className="ml-auto">
              {!isExpanded &&
                Object.keys(updatedContents).some((path2) =>
                  path2.startsWith(path)
                ) && <VscCircleOutline />}
              {doShowPills && (
                <div className="ml-auto flex p-1 border-[1px] border-gray-200 rounded-full">
                  {children.slice(0, 10).map((file) => (
                    <div className="m-[1px]">
                      <FileDot
                        name={file.name}
                        type={file.children?.length ? "folder" : "file"}
                        key={file.path}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ActionList.LinkItem>
      </Link>

      {isExpanded && (
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
        >
          {children.map((file) => (
            <Item
              key={file.name}
              depth={depth}
              {...file}
              activeFilePath={activeFilePath}
              updatedContents={updatedContents}
            />
          ))}
        </ActionList>
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
