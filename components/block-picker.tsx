import {
  InfoIcon,
  RepoIcon,
  SearchIcon,
  VerifiedIcon,
} from "@primer/octicons-react";
import { Link, ActionList, ActionMenu, Text, TextInput } from "@primer/react";
import { BlocksRepo, useFilteredBlocksRepos } from "hooks";
import { useState } from "react";

interface BlockPickerProps {
  button?: React.ReactNode;
  value?: Block;
  path?: string;
  type: "file" | "folder";
  onChange: (newType: Block) => void;
}

export default function BlockPicker(props: BlockPickerProps) {
  const { button, value, path, type, onChange } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const lowerSearchTerm = searchTerm.toLowerCase();

  const { data: blockRepos } = useFilteredBlocksRepos(path, type);

  return (
    <ActionMenu open={isOpen} onOpenChange={setIsOpen}>
      <ActionMenu.Button aria-expanded={isOpen} disabled={!blockRepos}>
        {button ?? `Block: ${value?.title}`}
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
            <div className="max-h-[calc(100vh-20em)] overflow-auto">
              {blockRepos &&
                blockRepos.map((repo, index) => {
                  if (index > 15) return null;
                  return repo.blocks.map((block) => {
                    if (
                      searchTerm &&
                      !block.title.toLowerCase().includes(lowerSearchTerm)
                    )
                      return null;
                    return (
                      <BlockItem
                        key={block.entry}
                        block={block}
                        value={value}
                        repo={repo}
                        onChange={onChange}
                        setIsOpen={setIsOpen}
                      />
                    );
                  });
                })}
            </div>
          </ActionList.Group>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}

const BlockItem = ({
  block,
  value,
  repo,
  setIsOpen,
  onChange,
}: {
  block: Block;
  value: Block;
  repo: BlocksRepo;
  setIsOpen: (isOpen: boolean) => void;
  onChange: (newType: Block) => void;
}) => {
  const isExampleBlock = repo.full_name === `githubnext/blocks-examples`;
  const isSelected = block.id === value?.id;
  return (
    <ActionList.Item
      selected={isSelected}
      onSelect={() => {
        const enhancedBlock = {
          ...block,
          owner: repo.owner,
          repo: repo.repo,
        };
        onChange(enhancedBlock);
        setIsOpen(false);
      }}
    >
      <div className="font-semibold">{block.title}</div>
      <ActionList.Description variant="block">
        <Link
          href={`https://github.com/${repo.full_name}`}
          className="flex items-center mt-1"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Text className="mr-1" color="fg.muted">
            <RepoIcon />
          </Text>
          <Text color="fg.muted" className="underline">
            {repo.owner}/{repo.repo}
            {isExampleBlock && (
              <Text ml={1} color="ansi.blue">
                <VerifiedIcon />
              </Text>
            )}
          </Text>
        </Link>
        <div className="flex items-start mt-1">
          <div className="mr-1">
            <InfoIcon />
          </div>
          {block.description}
        </div>
      </ActionList.Description>
    </ActionList.Item>
  );
};
