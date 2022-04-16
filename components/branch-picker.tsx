import { GitBranchIcon, SearchIcon } from "@primer/octicons-react";
import { ActionList, ActionMenu, TextInput } from "@primer/react";
import { useMemo, useState } from "react";

interface BranchPickerProps {
  value: string;
  branches: Branch[];
  onChange: (newBranch: string) => void;
}

export default function BranchPicker(props: BranchPickerProps) {
  const { value, branches, onChange } = props;

  const [searchTerm, setSearchTerm] = useState("");

  const filteredBranches = useMemo(
    () =>
      searchTerm
        ? branches.filter((branch) =>
            branch.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : branches,
    [searchTerm, branches]
  );

  return (
    <ActionMenu
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSearchTerm("");
        }
      }}
    >
      <ActionMenu.Button title={value}>
        <span className="mr-1">
          <GitBranchIcon />
        </span>
        <div className="inline-block align-middle truncate max-w-[20em]">
          {value}
        </div>
      </ActionMenu.Button>

      <ActionMenu.Overlay width="medium">
        <div className="px-3 pt-3 w-full">
          <TextInput
            value={searchTerm}
            icon={SearchIcon}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search branches"
            className="!pl-2 w-full"
          />
        </div>
        <ActionList
          className="max-h-[calc(95vh-10em)] overflow-auto"
          selectionVariant="single"
        >
          {filteredBranches.map((branch) => {
            return (
              <ActionList.Item
                key={branch.name}
                selected={branch.name === value}
                onSelect={() => {
                  onChange(branch.name);
                }}
                title={branch.name}
              >
                <div className="truncate">{branch.name}</div>
              </ActionList.Item>
            );
          })}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
