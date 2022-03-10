import { Button, SelectMenu } from "@primer/react";
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
    <SelectMenu className="relative" ml={3} >
      <Button as="summary">
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
                selected={!isChoosingCustomBlock && d.id === value?.id}
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
            className="bg-[#E9F2F2] hover:bg-[#E9F2F2] text-[#596c6c] font-medium pl-0 py-3"
            onClick={() => {
              setIsChoosingCustomBlock(true);
            }}
          >
            ✨ Choose a custom Block ✨
          </SelectMenu.Item>
        </SelectMenu.List>
      </SelectMenu.Modal>
    </SelectMenu>
  );
}
