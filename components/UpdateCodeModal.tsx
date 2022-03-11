import { ConfirmationDialog, Flash, Link, Text } from "@primer/react";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import { diffAsText } from "unidiff";

export const UpdateCodeModal = ({
  path,
  newCode,
  currentCode = "",
  isLoggedIn = false,
  onSubmit,
  onClose,
}: {
  path: string;
  newCode: string;
  currentCode?: string;
  isLoggedIn: boolean;
  onSubmit: (metadata: any) => void;
  onClose: () => void;
}) => {
  const diff = diffAsText(currentCode, newCode);
  const files = parseDiff(diff);
  const isMetadata = path.startsWith(".github/blocks/");

  return (
    <div className="relative z-50">
      <ConfirmationDialog
        title={
          isLoggedIn ? "Let's make that change" : "Authentication required"
        }
        cancelButtonContent={"Cancel"}
        confirmButtonContent={isLoggedIn ? "Commit changes" : "Close"}
        onClose={async (gesture) => {
          if (gesture === "confirm" && isLoggedIn) {
            await onSubmit(newCode);
          }
          onClose();
        }}
      >
        {isLoggedIn ? (
          <div className="border border-gray-200 rounded-md p-4">
            <div className="pb-4 text-lg">
              {isMetadata ? (
                <>
                  We store Block metadata in the{" "}
                  <pre className="inline bg-gray-100 py-1 p-2 rounded-md">
                    .github/blocks/
                  </pre>{" "}
                  folder. To update it, we'll create a commit for that metadata
                  file.
                </>
              ) : (
                <>
                  We'll create a commit to update the{" "}
                  <pre className="inline bg-gray-100 py-1 p-2 rounded-md">
                    {path}
                  </pre>{" "}
                  file.
                </>
              )}
            </div>
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: "calc(100vh - 27em)",
                minHeight: "20em",
              }}
            >
              {files.map(({ oldRevision, newRevision, type, hunks }) => (
                <Diff
                  key={oldRevision + "-" + newRevision}
                  viewType="split"
                  diffType={type}
                  hunks={hunks}
                >
                  {(hunks) =>
                    hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
                  }
                </Diff>
              ))}
            </div>
            <Flash variant="warning">
              <Text fontWeight="bold">Warning:</Text> this will only work if you
              have write access to the current repo.
            </Flash>
          </div>
        ) : (
          <p className="pb-4 text-lg">
            Hop over to <Link href="/">the homepage</Link> to sign in before you
            make any changes to this repo.
          </p>
        )}
      </ConfirmationDialog>
    </div>
  );
};
