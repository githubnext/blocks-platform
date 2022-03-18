import { GitBranchIcon } from "@primer/octicons-react";
import { ActionList, ActionMenu } from "@primer/react";
import { Branch } from "ghapi";

interface BranchPickerProps {
  value: string;
  branches: Branch[];
  onChange: (newBranch: string) => void;
}

export default function BranchPicker(props: BranchPickerProps) {
  const { value, branches, onChange } = props;

  return (
    <ActionMenu>
      <ActionMenu.Button>
        <span className="mr-1">
          <GitBranchIcon />
        </span>
        {value}
      </ActionMenu.Button>

      <ActionMenu.Overlay width="medium">
        <ActionList>
          <ActionList.Group title="Branches" selectionVariant="single">
            {branches.map((branch) => {
              return (
                <ActionList.Item
                  key={branch.name}
                  selected={branch.name === value}
                  onSelect={() => {
                    onChange(branch.name);
                  }}
                >
                  {branch.name}
                </ActionList.Item>
              );
            })}
          </ActionList.Group>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
