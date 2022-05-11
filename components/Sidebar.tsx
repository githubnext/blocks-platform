import { ActionList, Box, StyledOcticon, Truncate } from "@primer/react";
import { extent, scaleLinear, timeFormat } from "d3";
import type { ScaleLinear } from "d3";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getNestedFileTree } from "@githubnext/utils";
import type { RepoFiles } from "@githubnext/utils";
import languageColors from "../language-colors.json";
import { Tooltip } from "./Tooltip";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  FileIcon,
} from "@primer/octicons-react";
import { VscCircleFilled, VscCircleOutline } from "react-icons/vsc";

// defined in @githubnext/utils but not exported
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

type FileChange = {
  date: number;
};

type FileChanges = Record<string, FileChange>;

type FileChangesScale = ScaleLinear<string, string>;

type SidebarProps = {
  owner: string;
  repo: string;
  files: RepoFiles;
  fileChanges?: FileChanges;
  activeFilePath: string;
  updatedContents: Record<string, unknown>;
};

const doShowPills = false;
export const Sidebar = ({
  owner = "",
  repo = "",
  fileChanges = {},
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

  const allUsers = [];

  const fileChangesScale = useMemo(() => {
    const datesExtent = extent(
      Object.values(fileChanges),
      (d: FileChange) => new Date(d.date)
    );
    return scaleLinear<string>().domain(datesExtent).range(["#aaa", "#F9FAFB"]);
  }, [fileChanges]);

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
            allUsers={allUsers}
            fileChangesScale={fileChangesScale}
            fileChanges={fileChanges}
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
  allUsers: User[];
  depth: number;
  fileChangesScale: FileChangesScale;
  fileChanges: FileChanges;
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
      activeUsers={props.allUsers.filter((user) => user.path === props.path)}
      date={props.fileChanges[props.path]?.date}
    />
  );
};

type FolderProps = {
  name: string;
  path: string;
  depth: number;
  children: NestedFileTree[];
  activeFilePath: string;
  allUsers: User[];
  fileChangesScale: FileChangesScale;
  fileChanges: FileChanges;
  canCollapse?: boolean;
  updatedContents: Record<string, unknown>;
};

const Folder = ({
  name,
  path,
  children,
  activeFilePath,
  allUsers,
  fileChangesScale,
  fileChanges,
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

  const mostRecentChangeDate = useMemo(() => {
    const relatedChangePaths = Object.keys(fileChanges).filter((d) =>
      d.startsWith(path)
    );

    const mostRecentChange = relatedChangePaths.sort(
      (a, b) =>
        Number(new Date(fileChanges[a].date)) -
        Number(new Date(fileChanges[b].date))
    )[0];
    return mostRecentChange && fileChanges[mostRecentChange].date;
  }, [path, fileChangesScale]);

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
          style={{ paddingLeft: depth * 16 }}
          onClick={(e) => {
            console.log("clicking a folder", canCollapse, e);
            if (!canCollapse) return;
            setIsExpanded(!isExpanded);
          }}
        >
          <ActionList.LeadingVisual className="ml-1">
            <StyledOcticon
              sx={{ mr: 1 }}
              icon={isExpanded ? ChevronDownIcon : ChevronRightIcon}
            />
            <StyledOcticon
              sx={{ color: "#54aeff" }}
              icon={
                isExpanded ? FileDirectoryOpenFillIcon : FileDirectoryFillIcon
              }
            />
          </ActionList.LeadingVisual>
          <span className="ml-1">{name}</span>
          <ActionList.TrailingVisual className="flex items-center justify-center">
            <div>
              {!isExpanded &&
                Object.keys(updatedContents).some((path2) =>
                  path2.startsWith(path)
                ) && <VscCircleOutline />}
            </div>
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
            <DateChangedIndicator
              date={mostRecentChangeDate}
              fileChangesScale={fileChangesScale}
            />
          </ActionList.TrailingVisual>
        </ActionList.LinkItem>
      </Link>
      {isExpanded && (
        <ActionList
          className="!py-0 relative"
          sx={{
            "::before": {
              content: depth === 0 ? null : "''",
              position: "absolute",
              left: `calc(18px * ${depth} + ${10 - depth * 2}px)`,
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(208, 215, 222, 0.48)",
            },
          }}
        >
          {children
            .sort((a, b) => b.children.length - a.children.length)
            .map((file) => (
              <Item
                key={file.name}
                depth={depth}
                {...file}
                activeFilePath={activeFilePath}
                allUsers={allUsers}
                fileChangesScale={fileChangesScale}
                fileChanges={fileChanges}
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
  activeUsers: User[];
  fileChangesScale: FileChangesScale;
  date?: number;
  isActive: boolean;
  updatedContents: Record<string, unknown>;
};

const File = ({
  name,
  path,
  activeUsers = [],
  fileChangesScale,
  date,
  isActive,
  updatedContents,
  depth,
}: FileProps) => {
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
        style={{ paddingLeft: depth * 16 }}
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
          backgroundColor: isActive
            ? "rgba(208, 215, 222, 0.48)"
            : "transparent",
        }}
      >
        <ActionList.LeadingVisual>
          <StyledOcticon icon={FileIcon} />
        </ActionList.LeadingVisual>
        <Truncate title={name}>{name}</Truncate>
        <ActionList.TrailingVisual className="flex items-center justify-end">
          <div>{updatedContents[path] && <VscCircleFilled />}</div>
          <DateChangedIndicator
            date={date}
            fileChangesScale={fileChangesScale}
          />
        </ActionList.TrailingVisual>
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

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};
const formatDate = (d: Date) =>
  [
    timeFormat("%B %-d")(d),
    getOrdinal(+timeFormat("%d")(d)),
    timeFormat(", %Y")(d),
  ].join("");

type DateChangedIndicatorProps = {
  date?: number;
  fileChangesScale?: FileChangesScale;
};

const DateChangedIndicator = ({
  date,
  fileChangesScale,
}: DateChangedIndicatorProps) => {
  if (!date) return null;
  if (!fileChangesScale) return null;

  const backgroundColor = useMemo(() => {
    return date && fileChangesScale(new Date(date));
  }, [fileChangesScale, date]);

  return (
    <Tooltip side="right" text={`Last updated ${formatDate(new Date(date))}`}>
      <div
        className="absolute top-[-1px] bottom-[-1px] right-0 left-auto w-1"
        style={{
          backgroundColor,
        }}
      ></div>
    </Tooltip>
  );
};
