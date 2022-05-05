import { Box } from "@primer/react";
import { extent, scaleLinear, timeFormat } from "d3";
import type { ScaleLinear } from "d3";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { IoFolderOpenOutline, IoFolderOutline } from "react-icons/io5";
import {
  VscSymbolFile,
  VscCircleOutline,
  VscCircleFilled,
} from "react-icons/vsc";
import { getNestedFileTree } from "@githubnext/utils";
import type { RepoFiles } from "@githubnext/utils";
import languageColors from "../language-colors.json";
import { Tooltip } from "./Tooltip";

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
      <Box className="h-full overflow-auto">
        <div className="p-2 px-0 text-sm pb-20 text-left">
          <Item
            name={`${owner}/${repo}`}
            path={""}
            children={nestedFiles}
            activeFilePath={activeFilePath}
            allUsers={allUsers}
            fileChangesScale={fileChangesScale}
            fileChanges={fileChanges}
            canCollapse={false}
            updatedContents={updatedContents}
          />
        </div>
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
  fileChangesScale: FileChangesScale;
  fileChanges: FileChanges;
  canCollapse?: boolean;
  updatedContents: Record<string, unknown>;
};

const Item = (props: ItemProps) => {
  if (props.children.length) {
    return <Folder {...props} />;
  }
  return (
    <File
      {...props}
      isActive={props.activeFilePath === props.path}
      activeUsers={props.allUsers.filter((user) => user.path === props.path)}
      date={props.fileChanges[props.path]?.date}
    />
  );
};

type FolderProps = {
  name: string;
  path: string;
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
    <Box>
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
        <a
          className={`relative flex items-center justify-between py-2 pl-3 pr-3 text-left w-full text-sm whitespace-nowrap overflow-ellipsis ${
            isActive ? "bg-gray-50 border-gray-200" : " border-transparent"
          } border border-r-0`}
          onClick={() => {
            if (!canCollapse) return;
            setIsExpanded(!isExpanded);
          }}
        >
          <div className="flex items-center flex-1 max-w-full">
            <button
              className="mr-2 hover:text-indigo-700"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? <IoFolderOpenOutline /> : <IoFolderOutline />}
            </button>
            <div
              className="max-w-full flex-1 overflow-hidden overflow-ellipsis"
              title={name}
            >
              {name}
            </div>
            <div>
              {!isExpanded &&
                Object.keys(updatedContents).some((path2) =>
                  path2.startsWith(path)
                ) && <VscCircleOutline />}
            </div>
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
        </a>
      </Link>

      {isExpanded && (
        <div className="pl-6">
          {children
            .sort((a, b) => b.children.length - a.children.length)
            .map((file) => (
              <Item
                key={file.name}
                {...file}
                activeFilePath={activeFilePath}
                allUsers={allUsers}
                fileChangesScale={fileChangesScale}
                fileChanges={fileChanges}
                updatedContents={updatedContents}
              />
            ))}
        </div>
      )}
    </Box>
  );
};

type FileProps = {
  name: string;
  path: string;
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
      <a
        className={`relative flex items-center justify-between py-2 pl-3 pr-3 text-left w-full text-sm whitespace-nowrap overflow-ellipsis ${
          isActive ? "bg-gray-50 border-gray-200" : " border-transparent"
        } border border-r-0`}
      >
        <div className="flex items-center flex-1 max-w-full">
          <div className="mr-2">
            {doShowPills ? (
              <FileDot name={name} />
            ) : (
              <VscSymbolFile className="text-gray-400" />
            )}
          </div>
          <div
            className="max-w-full flex-1 overflow-hidden overflow-ellipsis"
            title={name}
          >
            {name}
          </div>
          <div>{updatedContents[path] && <VscCircleFilled />}</div>
        </div>
        <div className="group flex items-center h-0">
          {activeUsers.map((user) => (
            <div
              className="-ml-4 h-8 w-8 rounded-full bg-cover border-[0.2em] border-white group-hover:-ml-1 transition-all"
              key={user.id}
              style={{
                backgroundImage: `url(https://avatars.githubusercontent.com/${user.id})`,
              }}
            />
          ))}
        </div>
        <DateChangedIndicator date={date} fileChangesScale={fileChangesScale} />
      </a>
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
