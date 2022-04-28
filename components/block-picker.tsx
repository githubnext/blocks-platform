import {
  InfoIcon,
  RepoIcon,
  SearchIcon,
  VerifiedIcon,
} from "@primer/octicons-react";
import {
  Link,
  ActionList,
  ActionMenu,
  Text,
  TextInput,
  Button,
} from "@primer/react";
import { BlocksRepo, useFilteredBlocksRepos, useBlocksFromRepo } from "hooks";
import { QueryKeyMap } from "lib/query-keys";
import { useState } from "react";
import { useQueryClient } from "react-query";
import { useDebounce } from "use-debounce";

interface BlockPickerProps {
  button?: React.ReactNode;
  value?: Block;
  path?: string;
  type: "file" | "folder";
  installationUrl: string;
  onChange: (newType: Block) => void;
}

export default function BlockPicker(props: BlockPickerProps) {
  const { button, value, path, type, installationUrl, onChange } = props;
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const lowerSearchTerm = searchTerm.toLowerCase();
  let [debouncedSearchTerm] = useDebounce(lowerSearchTerm, 300);
  const queryClient = useQueryClient();

  const { data: blockRepos } = useFilteredBlocksRepos(path, type);

  // allow user to search for Blocks on a specific repo
  const isSearchTermUrl = debouncedSearchTerm.includes("github.com");
  const [searchTermOwner, searchTermRepo] = (debouncedSearchTerm || "")
    .split("/")
    .slice(-2);

  const { data: blocksUrlBlocks, status: blocksUrlStatus } = useBlocksFromRepo(
    {
      owner: searchTermOwner,
      repo: searchTermRepo,
    },
    {
      enabled: isSearchTermUrl,
    }
  );

  const blocksList = isSearchTermUrl
    ? [blocksUrlBlocks].filter(Boolean)
    : blockRepos;

  return (
    <ActionMenu open={isOpen} onOpenChange={setIsOpen}>
      <ActionMenu.Button aria-expanded={isOpen} disabled={!blockRepos}>
        {button ?? `Block: ${value?.title}`}
      </ActionMenu.Button>

      <ActionMenu.Overlay width="large">
        <div className="px-3 pt-3 w-full">
          <TextInput
            value={searchTerm}
            leadingVisual={SearchIcon}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blocks or paste repo URL"
            className="!pl-2 w-full"
          />
        </div>
        {isSearchTermUrl && blocksUrlStatus === "loading" && (
          <div className="px-3 py-6 mb-1 w-full text-center italic">
            <Text color="fg.muted">
              Loading Blocks from the{" "}
              <strong>
                {searchTermOwner}/{searchTermRepo}
              </strong>{" "}
              repository
            </Text>
          </div>
        )}
        {isSearchTermUrl && blocksUrlStatus === "error" && (
          <div className="py-5 mb-1 w-full text-center flex flex-col items-center">
            <Text color="fg.muted" className="px-5">
              We weren't able to find the{" "}
              <strong>
                {searchTermOwner}/{searchTermRepo}
              </strong>{" "}
              repo. If it's private, make sure our GitHub App has access to it.
            </Text>

            <div className="flex mt-4">
              <a
                target="_blank"
                rel="noopener"
                href={installationUrl}
                className="mr-2"
              >
                <Button variant="primary">Update App access</Button>
              </a>
              <Button
                onClick={() => {
                  queryClient.invalidateQueries(QueryKeyMap.blocksRepo.key);
                }}
              >
                Try again
              </Button>
            </div>
          </div>
        )}
        {isSearchTermUrl && blocksUrlStatus === "success" && !blocksUrlBlocks && (
          <div className="py-5 mb-1 w-full text-center flex flex-col items-center">
            <Text color="fg.muted" className="px-5">
              We weren't able to find any Blocks in{" "}
              <strong>
                {searchTermOwner}/{searchTermRepo}
              </strong>
              .
            </Text>
          </div>
        )}
        {!!blocksList?.length && (
          <ActionList>
            <ActionList.Group title="Blocks" selectionVariant="single">
              <div className="max-h-[calc(100vh-25em)] overflow-auto">
                {blocksList.map((repo, index) => {
                  if (index > 50) return null;
                  return repo.blocks.map((block) => {
                    if (
                      searchTerm &&
                      !isSearchTermUrl &&
                      !block.title.toLowerCase().includes(lowerSearchTerm)
                    )
                      return null;
                    return (
                      <BlockItem
                        key={block.entry}
                        block={block}
                        value={value}
                        repo={repo}
                        onChange={(block) => {
                          onChange(block);
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                      />
                    );
                  });
                })}
              </div>
            </ActionList.Group>
          </ActionList>
        )}
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}

const BlockItem = ({
  block,
  value,
  repo,
  onChange,
}: {
  block: Block;
  value: Block;
  repo: BlocksRepo;
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
