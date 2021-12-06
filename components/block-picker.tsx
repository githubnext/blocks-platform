import { Button, SelectMenu } from "@primer/components";
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

const customBlockId = "custom";
export default function BlockPicker(props: BlockPickerProps) {
  const { blocks, value, defaultBlock, path, isChoosingCustomBlock, setIsChoosingCustomBlock, onChange } = props;

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
    <SelectMenu>
      <Button ml={3} as="summary">
        {isChoosingCustomBlock ? "Custom Block" : `Block: ${value?.title}`}
      </Button>

      <SelectMenu.Modal>
        <SelectMenu.Header>Blocks</SelectMenu.Header>
        <SelectMenu.List>
          {blocks.map((d) => {
            return (
              <SelectMenu.Item
                as="button"
                key={d.entry}
                onClick={(e) => {
                  setIsChoosingCustomBlock(false);
                  onChange(d);
                }}
              >
                {d.title}
              </SelectMenu.Item>
            );
          })}
          <SelectMenu.Item
            as="button"
            onClick={() => {
              setIsChoosingCustomBlock(true);
            }}
          >
            Choose a custom Block
          </SelectMenu.Item>
        </SelectMenu.List>
      </SelectMenu.Modal>
    </SelectMenu>
  );
}
