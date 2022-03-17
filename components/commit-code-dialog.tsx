import {
  GitBranchIcon,
  GitCommitIcon,
  GitPullRequestIcon,
} from "@primer/octicons-react";
import {
  BranchName,
  Button,
  Dialog,
  FormControl,
  Radio,
  RadioGroup,
  Text,
  TextInput,
} from "@primer/react";
import { useCreateBranchAndPR, useUpdateFileContents } from "hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import { diffAsText } from "unidiff";

interface CommitCodeDialogProps {
  onClose: () => void;
  isOpen: boolean;
  newCode: string;
  currentCode?: string;
  path: string;
  sha: string;
  repo: string;
  owner: string;
  token: string;
}

type CommitType = "main" | "branch";

export function CommitCodeDialog(props: CommitCodeDialogProps) {
  const textInputRef = useRef(null);
  const [commitType, setCommitType] = useState<CommitType>("main");
  const [branchName, setBranchName] = useState("");
  const {
    onClose,
    isOpen,
    currentCode,
    newCode,
    path,
    owner,
    repo,
    sha,
    token,
  } = props;

  const { mutateAsync: updateContents, status: updateContentsStatus } =
    useUpdateFileContents({
      onSuccess: () => {
        onClose();
      },
    });
  const { mutateAsync: createBranch, status: createBranchStatus } =
    useCreateBranchAndPR({
      onSuccess: (prUrl) => {
        window.open(prUrl, "_blank");
        onClose();
      },
    });

  const handleCommit = async () => {
    if (commitType === "branch") {
      await createBranch({
        owner,
        repo,
        ref: branchName,
        sha,
        token,
        content: newCode,
        path,
      });
    } else {
      await updateContents({
        owner,
        repo,
        // By passing latest here, we are forcing the update function to fetch
        // the latest blob sha.
        sha: "latest",
        token,
        content: newCode,
        path,
      });
    }
  };
  const files = useMemo(
    () => parseDiff(diffAsText(currentCode, newCode)),
    [currentCode, newCode]
  );

  useEffect(() => {
    if (commitType === "branch" && textInputRef.current) {
      textInputRef.current.select();
    }
  }, [commitType]);

  const isLoading = createBranchStatus === "loading";

  return (
    <Dialog isOpen={isOpen} title="Commit changes" wide onDismiss={onClose}>
      <Dialog.Header>Editing {path}</Dialog.Header>

      <div className="p-4">
        <div
          style={{}}
          className="border rounded max-h-[400px] overflow-auto text-sm"
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
        <div className="mt-4">
          <RadioGroup
            disabled={isLoading}
            name="choiceGroup"
            onChange={(value) => {
              setCommitType(value as CommitType);
            }}
          >
            <RadioGroup.Label>Commit changes</RadioGroup.Label>
            <Text className="text-xs -mt-1 mb-1">
              <Text fontWeight="bold">Warning:</Text> this will only work if you
              have write access to the current repo.
            </Text>
            <FormControl>
              <Radio checked={commitType === "main"} value="main" />

              <FormControl.Label>
                <GitCommitIcon />
                <span className="ml-1">
                  Commit directly to the{" "}
                  <BranchName className="font-normal">main</BranchName> branch.
                </span>
              </FormControl.Label>
            </FormControl>
            <FormControl>
              <Radio checked={commitType === "branch"} value="branch" />
              <FormControl.Label>
                <GitPullRequestIcon />
                <span className="ml-1">
                  Create a new branch for this commit and start a pull request.
                </span>
              </FormControl.Label>
            </FormControl>
          </RadioGroup>
          {commitType === "branch" && (
            <div className="mt-1">
              <FormControl>
                <FormControl.Label visuallyHidden>
                  New branch name
                </FormControl.Label>
                <TextInput
                  ref={textInputRef}
                  className="font-mono"
                  leadingVisual={<GitBranchIcon />}
                  placeholder="New branch name"
                  value={branchName}
                  onChange={(e) => {
                    setBranchName(e.target.value);
                  }}
                />
              </FormControl>
            </div>
          )}
        </div>
      </div>
      <footer className="p-4 border-t flex items-center justify-end gap-2">
        <Button disabled={isLoading} variant="danger" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={isLoading}
          async
          type="button"
          variant="primary"
          onClick={handleCommit}
        >
          Commit changes
        </Button>
      </footer>
    </Dialog>
  );
}
