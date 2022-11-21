import { Block, BlocksRepo } from "@githubnext/blocks";
import {
  InfoIcon,
  LinkExternalIcon,
  PlugIcon,
  RepoIcon,
  SearchIcon,
  StarFillIcon,
  SyncIcon,
  VerifiedIcon,
} from "@primer/octicons-react";
import {
  ActionList,
  ActionMenu,
  Box,
  Button,
  IconButton,
  Link,
  Text,
  TextInput,
} from "@primer/react";
import { AppContext } from "context";
import { getBlockKey, useBlocksRepos } from "hooks";
import { QueryKeyMap } from "lib/query-keys";
import Image from "next/image";
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

  const blocksReposParams = {
    path,
    type,
    searchTerm: isSearchTermUrl ? undefined : debouncedSearchTerm,
    repoUrl: isSearchTermUrl ? debouncedSearchTerm : undefined,
    devServerInfo,
  };
  const { data: blockRepos, status } = useBlocksRepos(blocksReposParams);
  const invalidateBlocksReposQuery = () => {
    // we need to invalidate the `fetchQuery` calls in `getBlocksRepos` as well
    // as the top-level query. messy!
    if (isSearchTermUrl) {
      queryClient.invalidateQueries(
        QueryKeyMap.info.factory({
          owner: searchTermOwner,
          repo: searchTermRepo,
        })
      );
    } else {
      // there is only one `repoSearch` query currently
      queryClient.invalidateQueries(QueryKeyMap.repoSearch.key);
    }
    // we don't know which repos were returned so must invalidate all of them
    queryClient.invalidateQueries(QueryKeyMap.blocksRepo.key);
    queryClient.resetQueries(QueryKeyMap.blocksRepos.key);
  };

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

      <ActionMenu.Overlay width="xxlarge">
        <div className="px-3 pt-3 w-full flex gap-1">
          <TextInput
            value={searchTerm}
            leadingVisual={SearchIcon}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blocks or paste repo URL"
            className="!pl-2 flex-1"
          />
          <Button
            sx={{ px: 2 }}
            disabled={status === "loading"}
            aria-label="Refresh"
            onClick={invalidateBlocksReposQuery}
          >
            <SyncIcon className={status === "loading" ? "animate-spin" : ""} />
          </Button>
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
                  repo. Blocks doesn't work with private repos.
                </Text>
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
          <ActionList sx={{ pb: 0 }}>
            <div className="max-h-[calc(100vh-25em)] grid grid-cols-2 gap-1 px-2 pb-2 overflow-auto">
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
    <button
      className={`group m-1 flex flex-col rounded-xl text-left ${
        isDev
          ? "bg-[#ddf4ffaa] !border !border-dashed !border-[#54aeff] !mb-2"
          : "!border border-gray-200"
      } ${
        isSelected
          ? "bg-blue-100 border-blue-500"
          : `cursor-pointer ${
              isDev ? "hover:bg-[#ddf4ff]" : "hover:bg-gray-100"
            }`
      }`}
      onClick={() => {
        onChange(block);
      }}
    >
      <Box className="w-full flex items-start py-3 px-3">
        <Box className="w-full ml-2 flex-1">
          <div className="relative w-full flex justify-between">
            <div className="font-semibold text-sm leading-tight">
              {block.title}
            </div>
            <img
              src={`https://avatars.githubusercontent.com/${repo.owner}`}
              width={40}
              className="absolute right-0 rounded-full shadow-lg ml-auto"
            />

            {/* {isDev ? (
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
            )} */}
          </div>

          <Text color="fg.muted" className="mt-1 text-xs">
            By {repo.owner}
            {isExampleBlock && (
              <Text ml={1} color="ansi.blue">
                <VerifiedIcon />
              </Text>
            )}
          </Text>

          {/* <Box className="flex items-center mt-1">
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
          </Box> */}
          <div className="flex items-start mt-1 text-sm text-gray-900 mb-1">
            {block.description}
          </div>

          <div className="flex items-center text-xs">
            <StarFillIcon className="text-gray-300 mr-1" />
            <Text color="fg.muted" className="text-sm">
              {repo.stars} stars
            </Text>
          </div>
        </Box>
      </Box>
      <div
        className={`w-full mt-auto rounded-b-xl px-3 ${
          isSelected ? "bg-blue-200 text-blue-900" : "bg-gray-300 bg-opacity-20"
        }`}
      >
        {!block?.matches?.length || block.matches.includes("*") ? (
          <div className="text-xs italic mt-2 pb-2 opacity-60">
            This block works for all {block.type}s
          </div>
        ) : (
          <div className="flex flex-wrap items-center">
            {block.matches.map((match) => (
              <div className="flex items-center m-1 text-xs font-mono py-1 px-2 rounded-lg bg-gray-300 bg-opacity-40 border border-gray-800 border-opacity-50">
                {match || "/"}
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
};
