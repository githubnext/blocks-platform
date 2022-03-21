import { Box } from "@primer/react";
import { extent, scaleLinear, timeFormat } from "d3";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { IoFolderOpenOutline, IoFolderOutline } from "react-icons/io5";
import { VscSymbolFile } from "react-icons/vsc";
import { getNestedFileTree } from "@githubnext/utils";
import languageColors from "./../language-colors.json";
import { Tooltip } from "./Tooltip";

const doShowPills = false;
export const Sidebar = ({
  owner = "",
  repo = "",
  fileChanges = {},
  files = [],
  activeFilePath = "",
}) => {
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
      (d) => new Date(d.date)
    );
    return scaleLinear().domain(datesExtent).range(["#aaa", "#F9FAFB"]);
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
          />
        </div>
      </Box>
    </Box>
  );
};

const Item = (props) => {
  if (props.children.length) {
    return (
      <Folder
        {...props}
        activeFilePath={props.activeFilePath}
        allUsers={props.allUsers}
        fileChangesScale={props.fileChangesScale}
        fileChanges={props.fileChanges}
      />
    );
  }
  return (
    <File
      {...props}
      isActive={props.activeFilePath === props.path}
      activeUsers={props.allUsers.filter((user) => user.path === props.path)}
      fileChangesScale={props.fileChangesScale}
      date={props.fileChanges[props.path]?.date}
    />
  );
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
}) => {
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
      (a, b) => new Date(fileChanges[a].date) - new Date(fileChanges[b].date)
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
            path,
          },
        }}
      >
        <a
          className={`relative flex items-center text-left w-full whitespace-nowrap overflow-ellipsis ${
            isActive ? "bg-gray-50 border-gray-200" : " border-transparent"
          } border border-r-0`}
          onClick={() => {
            if (!canCollapse) return;
            setIsExpanded(!isExpanded);
          }}
        >
          <button
            className="mr-2 text-sm pl-3 py-2 hover:text-indigo-700"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <IoFolderOpenOutline /> : <IoFolderOutline />}
          </button>
          <div className="py-2 pr-3">{name}</div>
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
              />
            ))}
        </div>
      )}
    </Box>
  );
};
const File = ({
  name,
  path,
  activeUsers = [],
  fileChangesScale,
  date,
  isActive,
}) => {
  const router = useRouter();
  const query = router.query;

  return (
    <Link
      shallow
      href={{
        pathname: router.pathname,
        query: {
          ...query,
          path,
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
          <div className="max-w-full flex-1 overflow-hidden overflow-ellipsis">
            {name}
          </div>
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

const FileDot = ({ name, type = "file" }) => {
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

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};
const formatDate = (d) =>
  [
    timeFormat("%B %-d")(d),
    getOrdinal(+timeFormat("%d")(d)),
    timeFormat(", %Y")(d),
  ].join("");
const DateChangedIndicator = ({ date, fileChangesScale }) => {
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
