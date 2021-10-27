import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { IoFolderOpenOutline, IoFolderOutline } from 'react-icons/io5';
import { GoMarkGithub } from 'react-icons/go';
import { VscSymbolFile } from 'react-icons/vsc';
import { Box } from '@primer/components';

export const Sidebar = ({ owner, repo, files = [], activeFilePath }) => {
  if (!files.map) return null;

  const allUsers = []

  return (
    <Box className="h-full !border-gray-200 overflow-auto flex-1" borderRight="1px solid">
      {/* <div className="p-4 w-full border-b">
        <a
          className="flex items-center space-x-1"
          target="_blank"
          href={`https://github.com/${owner}/${repo}`}
        >
          <GoMarkGithub />
          <span>
            {owner}/{repo}
          </span>
        </a>
      </div> */}
      <div className="p-2 px-3 text-sm pb-20 text-left">
        {files
          .sort(
            (a, b) =>
              !!b.children.length - !!a.children.length ||
              a.name.localeCompare(b.name)
          )
          .map(file => (
            <Item
              key={file.name}
              {...file}
              activeFilePath={activeFilePath}
              allUsers={allUsers}
            />
          ))}
      </div>
    </Box>
  );
};

const Item = item => {
  if (item.children.length) {
    return (
      <Folder
        {...item}
        activeFilePath={item.activeFilePath}
        allUsers={item.allUsers}
      />
    );
  }
  return (
    <File
      {...item}
      isActive={item.activeFilePath === item.path}
      activeUsers={item.allUsers.filter(user => user.path === item.path)}
    />
  );
};

const Folder = ({
  name,
  children,
  activeFilePath,
  allUsers,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded && activeFilePath?.includes(name)) {
      setIsExpanded(true);
    }
  }, [activeFilePath]);

  return (
    <Box className="" >
      <button
        className="flex items-center py-2 px-2 text-left w-full whitespace-nowrap overflow-ellipsis"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="mr-2 text-sm">
          {isExpanded ? <IoFolderOpenOutline /> : <IoFolderOutline />}
        </div>
        {name}
      </button>

      {isExpanded && (
        <div className="pl-6">
          {children
            .sort((a, b) => b.children.length - a.children.length)
            .map(file => (
              <Item
                key={file.name}
                {...file}
                activeFilePath={activeFilePath}
                allUsers={allUsers}
              />
            ))}
        </div>
      )}
    </Box>
  );
};
const File = ({ name, path, activeUsers = [], isActive }) => {
  const router = useRouter();
  const query = router.query;
  return (
    <Link
      shallow
      href={{
        pathname: router.pathname,
        query: { ...query, path },
      }}
    >
      <a
        className={`relative flex items-center justify-between py-2 pl-2 text-left w-full text-sm whitespace-nowrap overflow-ellipsis ${isActive ? 'bg-indigo-100' : ''
          }`}
      >
        <div className="flex items-center flex-1 max-w-full">
          <div className="mr-2">
            <VscSymbolFile />
          </div>
          <div className="max-w-full flex-1 overflow-hidden overflow-ellipsis">
            {name}
          </div>
        </div>
        <div className="group flex items-center h-0">
          {activeUsers.map(user => (
            <div
              className="-ml-4 h-8 w-8 rounded-full bg-cover border-[0.2em] border-white group-hover:-ml-1 transition-all"
              key={user.id}
              style={{
                backgroundImage: `url(https://avatars.githubusercontent.com/${user.id})`,
              }}
            />
          ))}
        </div>
      </a>
    </Link>
  );
};
