import { RepoFiles } from "@githubnext/blocks";
import { Command } from "cmdk";
import { useEffect, useState } from "react";

interface RepoCommandMenuProps {
  files: RepoFiles;
}

export function RepoCommandMenu(props: RepoCommandMenuProps) {
  const { files = [] } = props;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && e.metaKey) {
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Command.Dialog
      className="fixed bg-black/20 inset-0 w-full h-full flex flex-col items-center justify-center z-10"
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
      label="Global Command Menu"
    >
      <div className="bg-white max-w-2xl overflow-hidden w-full rounded-lg divide-y">
        <Command.Input
          className="p-4 w-full rounded-tl-lg rounded-tr-lg text-lg"
          placeholder="Search for files or folders"
        />
        <Command.List className="h-[200px] overflow-y-scroll">
          <Command.Empty>No results found.</Command.Empty>
          {files.map((file) => (
            <Command.Item className="p-2" key={file.sha}>
              {file.path}
            </Command.Item>
          ))}

          <Command.Item>Apple</Command.Item>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
