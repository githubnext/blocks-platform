import { Link } from "@primer/react";
import { EyeIcon, StarFillIcon } from "@primer/octicons-react";
import { getRelativeTime } from "lib/date-utils";
import { useMemo, useState } from "react";
import { useCustomBlocks } from "hooks";

interface CustomBlockPickerProps {
  path: string;
  isFolder: boolean;
  onChange: (block: Block) => void;
}
export const CustomBlockPicker = ({
  path,
  isFolder,
  onChange,
}: CustomBlockPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const customBlockRepos = useCustomBlocks(path, isFolder ? "folder" : "file");

  const filteredRepos = useMemo(
    () =>
      customBlockRepos
        .map((repo) => ({
          ...repo,
          blocks: repo.blocks.filter(
            (block) =>
              !searchTerm ||
              `${repo.owner}/${repo.repo} ${block.title} ${block.description}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((repo) => repo.blocks.length > 0)
        .sort((a, b) => b.stars - a.stars),
    [customBlockRepos, searchTerm]
  );

  return (
    <div className="w-full h-full overflow-auto p-10 pb-20 bg-[#e9f2f2]">
      <div className="w-full flex pb-4 items-center">
        <div className="flex-1">{/* for horizontal spacing */}</div>
        <div className="flex-[2]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 px-5 border-none rounded-lg focus:outline-none"
            placeholder="Search for a Block"
          />
        </div>
      </div>

      <BlocksList repos={filteredRepos} onChange={onChange} />
    </div>
  );
};

const BlocksList = ({ repos, onChange }) => {
  return (
    <div className="w-full ">
      {repos.map((repo) => (
        <div className="flex py-6" key={repo.full_name}>
          <div className="flex-1 min-w-0 py-5 p">
            <Link
              href={`http://github.com/${repo.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <a className="font-bold text-blue-500 leading-5 text-lg">
                {repo.full_name}
              </a>
            </Link>
            <div className="flex space-x-3 text-gray-500 text-sm my-2">
              <div className="flex items-center">
                <StarFillIcon className="mr-1" />
                {repo.stars}
              </div>
              <div className="flex items-center">
                <EyeIcon className="mr-1" />
                {repo.watchers}
              </div>
            </div>
            <div className="flex space-x-3 text-gray-500 text-sm">
              <div className="text-gray">
                Last release:{" "}
                <span className="font-mono">{repo.release.tag_name}</span>
                <div className="italic">
                  {getRelativeTime(new Date(repo.release.published_at))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-[2] min-w-0 flex flex-col">
            {repo.blocks.map((block) => (
              <Block
                key={block.id}
                block={block}
                onSelect={() =>
                  onChange({ ...block, owner: repo.owner, repo: repo.repo })
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Block = ({ block, onSelect }) => {
  return (
    <button
      className="py-5 px-6 text-left bg-white hover:bg-indigo-500 focus:outline-none focus:bg-indigo-600 hover:text-white focus:text-white shadow mb-4 rounded-xl"
      onClick={onSelect}
    >
      <div className="font-semibold mb-1 text-lg">{block.title}</div>
      <div className="opacity-60">{block.description}</div>
    </button>
  );
};
