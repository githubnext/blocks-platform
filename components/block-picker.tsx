import { PlusIcon } from "@primer/octicons-react";
import { ActionList, ActionMenu } from "@primer/react";
import { useEffect, useState } from "react";

interface BlockPickerProps {
  blocks: Block[];
  value: Block;
  defaultBlock?: Block;
  path: string;
  isChoosingCustomBlock: boolean;
  setIsChoosingCustomBlock: (isChoosingCustomBlock: boolean) => void;
  onChange: (newType: Block) => void;
}

export default function BlockPicker(props: BlockPickerProps) {
  const {
    blocks,
    value,
    defaultBlock,
    path,
    isChoosingCustomBlock,
    setIsChoosingCustomBlock,
    onChange,
  } = props;

  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => {
    if (defaultBlock) {
      // ignore on initial load
      if (!hasLoaded) {
        setHasLoaded(true);
      } else {
        onChange(defaultBlock);
      }
    }
  }, [path]);

  return (
    <ActionMenu>
      <ActionMenu.Button>
        {isChoosingCustomBlock ? "Custom Block" : `Block: ${value?.title}`}
      </ActionMenu.Button>

      <ActionMenu.Overlay width="medium">
        <ActionList>
          <ActionList.Group title="Blocks" selectionVariant="single">
            {blocks.map((d) => {
              return (
                <ActionList.Item
                  key={d.entry}
                  selected={!isChoosingCustomBlock && d.id === value?.id}
                  onSelect={(e) => {
                    setIsChoosingCustomBlock(false);
                    onChange(d);
                  }}
                >
                  {d.title}
                </ActionList.Item>
              );
            })}
          </ActionList.Group>
          <ActionList.Divider />
          <ActionList.Item
            onSelect={() => {
              setIsChoosingCustomBlock(true);
            }}
          >
            <ActionList.LeadingVisual>
              <PlusIcon />
            </ActionList.LeadingVisual>
            Choose a custom Block
          </ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
