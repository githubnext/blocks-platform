import { Button, SelectMenu } from "@primer/components";
import { useEffect } from "react";

interface BlockPickerProps {
  blocks: Block[];
  value: Block;
  isFolder?: boolean;
  path: string;
  onChange: (newType: Block) => void;
}

export default function BlockPicker(props: BlockPickerProps) {
  const { blocks, value, path, isFolder, onChange } = props;
  // const defaultBlock = isFolder ? "sidebar" : (getBlockFromFilename(`.${extension}`) || "code")
  const extension = path.split(".").slice(-1)[0];
  const relevantBlocks = blocks.filter(
    (d) =>
      !d.extensions ||
      d.extensions.includes("*") ||
      d.extensions.includes(extension)
  );

  useEffect(() => {
    if (!relevantBlocks?.find((v) => v?.entry === value?.entry)) {
      onChange(relevantBlocks[0]);
    }
  }, [value, relevantBlocks?.map((d) => d.entry).join(",")]);

  // start with the second default block not the code one
  useEffect(() => {
    if (relevantBlocks.length > 0) {
      onChange(relevantBlocks[1]);
    }
  }, [relevantBlocks?.map((d) => d.entry).join(",")]);

  return (
    <SelectMenu>
      <Button ml={3} as="summary">
        Block: {value?.title}
      </Button>

      <SelectMenu.Modal>
        <SelectMenu.Header>Blocks</SelectMenu.Header>
        <SelectMenu.List>
          {relevantBlocks.map((d) => {
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
