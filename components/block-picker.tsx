import { Button, SelectMenu } from "@primer/components";
import { useEffect, useState } from "react";

interface BlockPickerProps {
  blocks: Block[];
  value: Block;
  defaultBlock?: Block;
  path: string;
  onChange: (newType: Block) => void;
}

export default function BlockPicker(props: BlockPickerProps) {
  const { blocks, value, defaultBlock, path, onChange } = props;

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
        Block: {value?.title}
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
                  onChange(d);
                }}
              >
                {d.title}
              </SelectMenu.Item>
            );
          })}
        </SelectMenu.List>
      </SelectMenu.Modal>
    </SelectMenu>
  );
}
