import { FileCodeIcon } from "@primer/octicons-react";
import { LinkButton } from "@primer/react";

export function EmptyRepositoryMessage({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-xl mx-auto px-4">
        <div className="text-center">
          <FileCodeIcon size={24} />
          <div className="mt-2">
            <h3 className="font-semibold text-lg">
              It looks like this repository is empty!
            </h3>
            <p>
              Once you've added some files to this repository, come back here to
              get started with Blocks.
            </p>
          </div>
          <div className="flex justify-center mt-4">
            <LinkButton
              variant="primary"
              href={`https://github.com/${owner}/${repo}`}
            >
              Add files
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
