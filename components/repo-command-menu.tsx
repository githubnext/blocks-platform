import { RepoFiles } from "@githubnext/blocks";
import {
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  FileIcon,
} from "@primer/octicons-react";
import { StyledOcticon } from "@primer/react";
import { Command } from "cmdk";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

interface RepoCommandMenuProps {
  files: RepoFiles;
}

export function RepoCommandMenu(props: RepoCommandMenuProps) {
  const { files = [] } = props;
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && e.metaKey) {
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      if (!router.isReady) return;
      router.replace({
        query: { ...router.query, path },
      });
      setOpen(false);
    },
    [router]
  );

  return (
    <Command.Dialog
      className="fixed left-1/2 max-w-2xl w-full top-1/2 z-10 transform -translate-y-1/2 -translate-x-1/2 bg-white rounded-lg shadow"
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
      label="Global Command Menu"
    >
      <div className="rounded-lg divide-y">
        <Command.Input
          className="p-4 w-full rounded-tl-lg rounded-tr-lg"
          placeholder="Search for files or folders"
        />
        <Command.List className="h-[200px] overflow-y-scroll">
          <Command.Empty className="p-2 text-sm text-gray-600">
            No files/folders found...
          </Command.Empty>
          <Command.Group
            heading={
              <span className="pl-3 text-gray-800 font-semibold text-xs">
                File Tree
              </span>
            }
          >
            {files.map((file) => (
              <Command.Item
                className="p-3 aria-selected:bg-gray-100 text-sm"
                onSelect={() => handleSelect(file.path)}
                key={file.sha}
              >
                {file.type === "tree" ? (
                  <StyledOcticon
                    sx={{ color: "#54aeff" }}
                    icon={FileDirectoryFillIcon}
                  />
                ) : (
                  <StyledOcticon icon={FileIcon} />
                )}
                <span className="ml-2">{file.path}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
