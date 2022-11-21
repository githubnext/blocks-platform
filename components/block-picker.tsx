import { Block } from "@githubnext/blocks";
import { PlugIcon, SearchIcon, SyncIcon } from "@primer/octicons-react";
import { ActionList, ActionMenu, Button, Text, TextInput } from "@primer/react";
import { AppContext } from "context";
import { getBlockKey, useBlocksRepos } from "hooks";
import { QueryKeyMap } from "lib/query-keys";
import { useContext, useState } from "react";
import { useQueryClient } from "react-query";
import { useDebounce } from "use-debounce";
import { BlockPickerItem } from "./block-picker-item";

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
  console.log(blockRepos);

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
            placeholder="Search blocks or paste repo URL like //github.com/githubnext/blocks-examples"
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
            <div className="max-h-[calc(100vh-20em)] grid grid-cols-2 gap-1 px-2 pb-2 overflow-auto">
              {blockRepos.map((repo, index) => {
                if (index > 50) return null;
                return repo.blocks.map((block) => {
                  const blockKey = getBlockKey(block);
                  return (
                    <BlockPickerItem
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
