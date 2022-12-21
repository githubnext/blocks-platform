import { Block, BlocksRepo } from "@githubnext/blocks";
import {
  LinkExternalIcon,
  PlugIcon,
  StarFillIcon,
  VerifiedIcon,
} from "@primer/octicons-react";
import { Box, Link, Text } from "@primer/react";

export const BlockPickerItem = ({
  block,
  isSelected,
  repo,
  onChange,
  isDev,
  isAllowed,
}: {
  block: Block;
  isSelected: boolean;
  repo: BlocksRepo;
  onChange: (newType: Block) => void;
  isDev: boolean;
  isAllowed?: boolean;
}) => {
  const isExampleBlock = repo.full_name === `githubnext/blocks-examples`;
  return (
    <button
      className={`group m-1 flex flex-col rounded-xl text-left ${
        isDev
          ? "bg-[#ddf4ffaa] !border !border-dashed !border-[#54aeff]"
          : "!border border-gray-200"
      } ${
        isSelected
          ? "bg-[#0969da] border-[#0550ae] text-white"
          : `cursor-pointer ${
              isDev ? "hover:bg-[#ddf4ff]" : "hover:bg-gray-100"
            }`
      }`}
      onClick={() => {
        onChange(block);
      }}
    >
      {isAllowed === false && (
        <div className="w-full px-5 pt-[0.1em] pb-1 bg-gray-600 text-white rounded-t-xl">
          <Text className="text-xs text-slate-800">Not in the allowlist</Text>
        </div>
      )}
      <div
        className={`w-full h-full flex flex-col ${
          isAllowed === false ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <Box className="w-full flex items-start py-3 px-3">
          <Box className="w-full ml-2 pt-1 flex-1">
            <div className="relative w-full flex items-center justify-between">
              <div className="font-semibold text-sm leading-tight">
                {block.title}
              </div>

              <div className="flex items-center text-xs space-x-3">
                <div className="flex items-center">
                  <StarFillIcon className="opacity-30 mr-[0.2em]" />
                  <Text className="opacity-70">{repo.stars}</Text>
                </div>
                {isDev ? (
                  <Text
                    className={`text-xs font-mono ${
                      isSelected ? "text-white" : "text-[#0969da]"
                    }`}
                    title="from dev server"
                  >
                    <PlugIcon className="ml-1" />
                  </Text>
                ) : (
                  <Link
                    href={`https://github.com/${repo.full_name}/${
                      block.entry ? `tree/main/${block.entry}` : ""
                    }`}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "inherit",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    title="View code on GitHub"
                  >
                    <LinkExternalIcon />
                  </Link>
                )}
              </div>
            </div>

            <div className="relative flex items-center mt-[0.3em]">
              {isExampleBlock && (
                <Text
                  color={isSelected ? "white" : "ansi.blue"}
                  className="mr-1 mt-[-0.2em]"
                  title="Verified block from the GitHub Next team"
                >
                  <VerifiedIcon />
                </Text>
              )}
              <img
                src={`https://avatars.githubusercontent.com/${repo.owner}`}
                width={20}
                className="rounded-full border flex-none"
              />
              <Text
                className="text-xs ml-1 flex-1 truncate"
                title={`${repo.owner}/${repo.repo}`}
              >
                <span className="opacity-70">
                  <Link
                    href={`https://github.com/${repo.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      color: "inherit",
                    }}
                  >
                    {repo.owner}/{repo.repo}
                  </Link>
                </span>
              </Text>
            </div>

            <div className="flex items-start mt-2 text-sm">
              {block.description}
            </div>
          </Box>
        </Box>

        <div
          className={`w-full mt-auto rounded-b-xl px-3 ${
            isSelected ? "bg-[#0550ae]" : "bg-gray-300 bg-opacity-20"
          }`}
        >
          {!block?.matches?.length || block.matches.includes("*") ? (
            <div className="text-xs italic pl-2 pb-[0.8em] pt-[0.6em] opacity-80">
              Works for all {block.type}s
            </div>
          ) : (
            <div className="flex flex-wrap items-center pt-[0.3em] pb-1">
              {block.matches.slice(0, 2).map((match) => (
                <div
                  className={`flex items-center mx-1 mb-[0.1em] text-[0.66rem] font-mono py-1 px-2 rounded-lg bg-white ${
                    isSelected ? "bg-[#0969da]" : "bg-white"
                  }`}
                >
                  {match || "/"}
                </div>
              ))}
              {block.matches.length > 2 && (
                <div
                  className="flex items-center mb-[0.1em] ml-1 text-[0.66rem] font-mono py-1"
                  title={`Also works for ${block.matches.slice(2).join(", ")}`}
                >
                  +{block.matches.length - 2}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
