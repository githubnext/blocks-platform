import { Block, BlocksRepo } from "@githubnext/blocks";
import {
  InfoIcon,
  LinkExternalIcon,
  PencilIcon,
  PlugIcon,
  RepoIcon,
  SearchIcon,
  VerifiedIcon,
} from "@primer/octicons-react";
import {
  ActionList,
  ActionMenu,
  Box,
  Button,
  Link,
  Text,
  TextInput,
} from "@primer/react";
import { AppContext } from "context";
import { getBlockKey, useBlocksRepos } from "hooks";
import { QueryKeyMap } from "lib/query-keys";
import { useContext, useState } from "react";
import { useQueryClient } from "react-query";
import { useDebounce } from "use-debounce";

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
  let [debouncedSearchTerm] = useDebounce(lowerSearchTerm, 300);
  const queryClient = useQueryClient();
  const appContext = useContext(AppContext);
  const { devServerInfo } = appContext;
  const valueBlockKey = value && getBlockKey(value);

  // allow user to search for Blocks on a specific repo
  const isSearchTermUrl = debouncedSearchTerm.includes("github.com");
  const [searchTermOwner, searchTermRepo] = (debouncedSearchTerm || "")
    .split("/")
    .slice(3);

  const { data: blockRepos, status } = useBlocksRepos({
    path,
    type,
    searchTerm: isSearchTermUrl ? undefined : debouncedSearchTerm,
    repoUrl: isSearchTermUrl ? debouncedSearchTerm : undefined,
    devServerInfo,
  });

  return (
    <ActionMenu open={isOpen} onOpenChange={setIsOpen}>
      <ActionMenu.Button aria-expanded={isOpen} disabled={!blockRepos}>
        {button ??
          (value ? (
            <>
              Block: {value.title}{" "}
              {value["isDev"] && <PlugIcon className="ml-1 text-[#0969da]" />}
            </>
          ) : (
            "Block: ..."
          ))}
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
        {status === "loading" && (
          <div className="px-3 py-6 mb-1 w-full text-center italic">
            <Text color="fg.muted" pb="1">
              {isSearchTermUrl ? (
                <>
                  Loading Blocks from the{" "}
                  <strong>
                    {searchTermOwner}/{searchTermRepo}
                  </strong>{" "}
                  repository
                </>
              ) : (
                "Loading Blocks..."
              )}
            </Text>
          </div>
        )}
        {status === "error" && (
          <div className="py-5 mb-1 w-full text-center flex flex-col items-center">
            {isSearchTermUrl ? (
              <>
                <Text color="fg.muted" className="px-5" pb="1">
                  We weren't able to find the{" "}
                  <strong>
                    {searchTermOwner}/{searchTermRepo}
                  </strong>{" "}
                  repo. If it's private, make sure our GitHub App has access to
                  it.
                </Text>

                <div className="flex mt-4">
                  <a
                    target="_blank"
                    rel="noopener"
                    href={appContext.installationUrl}
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
              </>
            ) : (
              <Text color="fg.muted" className="px-5" pb="1">
                We weren't able to find any Blocks.
              </Text>
            )}
          </div>
        )}
        {status === "success" && !blockRepos?.length && (
          <div className="py-5 mb-1 w-full text-center flex flex-col items-center">
            <Text color="fg.muted" className="px-5" pb="1">
              {isSearchTermUrl ? (
                <>
                  We weren't able to find any relevant Blocks in{" "}
                  <strong>
                    {searchTermOwner}/{searchTermRepo}
                  </strong>
                  .
                </>
              ) : (
                "No relevant Blocks found."
              )}
            </Text>
          </div>
        )}
        {!!blockRepos?.length && (
          <ActionList>
            <ActionList.Group title="Blocks" selectionVariant="single">
              <div className="max-h-[calc(100vh-25em)] overflow-auto">
                {blockRepos.map((repo, index) => {
                  if (index > 50) return null;
                  return repo.blocks.map((block) => {
                    const blockKey = getBlockKey(block);
                    return (
                      <BlockItem
                        key={blockKey}
                        block={block}
                        isSelected={blockKey === valueBlockKey}
                        repo={repo}
                        onChange={(block) => {
                          onChange(block);
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        isDev={!!repo["isDev"]}
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
  isSelected,
  repo,
  onChange,
  isDev,
}: {
  block: Block;
  isSelected: boolean;
  repo: BlocksRepo;
  onChange: (newType: Block) => void;
  isDev: boolean;
}) => {
  const isExampleBlock = repo.full_name === `githubnext/blocks-examples`;
  return (
    <ActionList.Item
      selected={isSelected}
      className={`group py-2 ${
        isDev ? "bg-[#ddf4ffaa] border border-dashed border-[#54aeff] mb-2" : ""
      }`}
      sx={{
        ":hover": {
          backgroundColor: isDev ? "#ddf4ff !important" : "transparent",
        },
      }}
      onSelect={() => {
        onChange(block);
      }}
    >
      <div className="flex justify-between">
        <div className="font-semibold">{block.title}</div>

        {isDev ? (
          <Text pb="1" className="text-xs font-mono text-[#0969da]">
            From dev server
            <PlugIcon className="ml-1" />
          </Text>
        ) : (
          <Link
            href={`https://github.com/${repo.full_name}`}
            className="text-xs mt-[2px] opacity-0 focus:opacity-100 group-hover:opacity-100"
            target="_blank"
            rel="noopener noreferrer"
            color="fg.muted"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Text className="flex items-center" color="fg.muted">
              View code
              <LinkExternalIcon className="ml-1 opacity-50" />
            </Text>
          </Link>
        )}
      </div>
      <ActionList.Description variant="block">
        <Box className="flex items-center mt-1">
          <Text className="mr-1" color="fg.muted">
            <RepoIcon />
          </Text>
          <Text color="fg.muted" pb="1">
            {repo.owner}/{repo.repo}
            {isExampleBlock && (
              <Text ml={1} color="ansi.blue">
                <VerifiedIcon />
              </Text>
            )}
          </Text>
        </Box>
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
