import { InfoIcon, RepoIcon, SearchIcon } from "@primer/octicons-react";
import { ActionList, ActionMenu, Button, Text, TextInput } from "@primer/react";
import { useCustomBlocks } from "hooks";
import { useEffect, useState } from "react";

interface BlockPickerProps {
  blocks: Block[];
  value: Block;
  defaultBlock?: Block;
  path: string;
  type: "file" | "folder";
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
    type,
    isChoosingCustomBlock,
    setIsChoosingCustomBlock,
    onChange,
  } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const lowerSearchTerm = searchTerm.toLowerCase();

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

  const customBlockRepos = useCustomBlocks(path, type);

  return (
    <ActionMenu open={isOpen} onOpenChange={setIsOpen}>
      <ActionMenu.Button aria-expanded={isOpen}>
        {isChoosingCustomBlock ? "Custom Block" : `Block: ${value?.title}`}
      </ActionMenu.Button>

      <ActionMenu.Overlay width="medium">
        <div className="px-3 pt-3 w-full">
          <TextInput
            value={searchTerm}
            icon={SearchIcon}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blocks"
            className="!pl-2 w-full"
          />
        </div>
        <ActionList>
          <ActionList.Group title="Blocks" selectionVariant="single">
            {blocks.map((block) => {
              if (
                searchTerm &&
                !block.title.toLowerCase().includes(lowerSearchTerm)
              )
                return null;
              if (
                block.owner !== "githubnext" ||
                block.repo !== "blocks-examples"
              )
                return null;
              return (
                <ActionList.Item
                  key={block.entry}
                  selected={!isChoosingCustomBlock && block.id === value?.id}
                  onSelect={(e) => {
                    setIsChoosingCustomBlock(false);
                    onChange(block);
                    setIsOpen(false);
                  }}
                  className="font-semibold"
                >
                  {block.title}
                </ActionList.Item>
              );
            })}
          </ActionList.Group>
          <ActionList.Divider />
          <ActionList.Group title="Custom Blocks" selectionVariant="single">
            <div className="max-h-[calc(100vh-30.5em)] overflow-auto">
              {customBlockRepos.map((repo, index) => {
                if (index > 15) return null;
                return repo.blocks.map((block) => {
                  if (
                    searchTerm &&
                    !block.title.toLowerCase().includes(lowerSearchTerm)
                  )
                    return null;
                  return (
                    <ActionList.Item
                      key={block.entry}
                      selected={
                        !isChoosingCustomBlock && block.id === value?.id
                      }
                      onSelect={() => {
                        const enhancedBlock = {
                          ...block,
                          owner: repo.owner,
                          repo: repo.repo,
                        };
                        setIsChoosingCustomBlock(false);
                        onChange(enhancedBlock);
                        setIsOpen(false);
                      }}
                    >
                      <div className="font-semibold">{block.title}</div>
                      <ActionList.Description variant="block">
                        <div className="flex items-center mt-1">
                          <div className="mr-1">
                            <RepoIcon />
                          </div>
                          <Text color="fg.muted">
                            {repo.owner}/{repo.repo}
                          </Text>
                        </div>
                        <div className="flex items-start mt-1">
                          <div className="mr-1">
                            <InfoIcon />
                          </div>
                          {block.description}
                        </div>
                      </ActionList.Description>
                    </ActionList.Item>
                  );
                });
              })}
            </div>
            <Button
              className="w-[calc(100%-1rem)] mx-2 mt-2 justify-center"
              leadingIcon={SearchIcon}
              onClick={() => {
                setIsChoosingCustomBlock(true);
                setIsOpen(false);
              }}
            >
              Look for a custom Block
            </Button>
          </ActionList.Group>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
