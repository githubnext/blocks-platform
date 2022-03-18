import {
  GitBranchIcon,
  GitCommitIcon,
  GitPullRequestIcon,
} from "@primer/octicons-react";
import {
  BranchName,
  Button,
  Dialog,
  Flash,
  FormControl,
  Radio,
  RadioGroup,
  Text,
  Textarea,
  TextInput,
} from "@primer/react";
import { useCreateBranchAndPR, useUpdateFileContents } from "hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import { useQueryClient } from "react-query";
import { diffAsText } from "unidiff";

interface CommitCodeDialogProps {
  onClose: () => void;
  isOpen: boolean;
  newCode: string;
  currentCode?: string;
  path: string;
  repo: string;
  owner: string;
  token: string;
  branchingDisabled?: boolean;
}

type CommitType = "main" | "branch";

export function CommitCodeDialog(props: CommitCodeDialogProps) {
  const textInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
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
    token,
    branchingDisabled,
  } = props;
  const queryClient = useQueryClient();

  const {
    mutate: updateContents,
    status: updateContentsStatus,
    error: updateContentsError,
  } = useUpdateFileContents({
    onSuccess: async () => {
      await queryClient.invalidateQueries("file");
      await queryClient.invalidateQueries("timeline");
      onClose();
    },
  });

  const {
    mutate: createBranch,
    status: createBranchStatus,
    error: createBranchError,
  } = useCreateBranchAndPR({
    onSuccess: (prUrl) => {
      window.open(prUrl, "_blank");
      onClose();
      setTitle("");
      setBody("");
      setCommitType("main");
    },
  });

  const handleCommit = () => {
    if (commitType === "branch") {
      try {
        createBranch({
          owner,
          repo,
          ref: branchName,
          token,
          content: newCode,
          path,
          title,
          body,
        });
      } catch (e) {}
    } else {
      try {
        updateContents({
          owner,
          repo,
          sha: "latest",
          token,
          content: newCode,
          path,
        });
      } catch (e) {}
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

  const isLoading =
    createBranchStatus === "loading" || updateContentsStatus === "loading";

  return (
    <Dialog
      className="overflow-auto"
      isOpen={isOpen}
      title="Commit changes"
      wide
      onDismiss={onClose}
    >
      <Dialog.Header>Editing {path}</Dialog.Header>

      <div className="p-4">
        {(createBranchError || updateContentsError) && (
          <div className="mb-4">
            <Flash variant="danger">
              {createBranchError &&
                (createBranchError?.message || "An unexpected error occurred.")}
              {updateContentsError &&
                (updateContentsError?.message ||
                  "An unexpected error occurred.")}
            </Flash>
          </div>
        )}

        <div
          style={{}}
          className="border rounded max-h-[200px] overflow-auto text-sm"
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
            <FormControl disabled={branchingDisabled}>
              <Radio checked={commitType === "branch"} value="branch" />
              <FormControl.Label>
                <GitPullRequestIcon />
                <span className="ml-1">
                  Create a new branch for this commit and start a pull request.
                </span>
              </FormControl.Label>
              {branchingDisabled && (
                <FormControl.Caption>
                  Sorry! We only allow creating a branch from the most recent
                  version of the file.
                </FormControl.Caption>
              )}
            </FormControl>
          </RadioGroup>
          {commitType === "branch" && (
            <div className="mt-1">
              <div className="flex flex-col gap-2">
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
                <FormControl>
                  <FormControl.Label visuallyHidden>PR Title</FormControl.Label>
                  <TextInput
                    placeholder="PR Title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                    }}
                  />
                </FormControl>
                <FormControl>
                  <FormControl.Label visuallyHidden>PR Title</FormControl.Label>
                  <Textarea
                    placeholder="PR Body"
                    rows={4}
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                    }}
                  />
                </FormControl>
              </div>
            </div>
          )}
        </div>
      </div>
      <footer className="p-4 border-t flex items-center justify-end gap-2">
        <Button disabled={isLoading} variant="danger" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={isLoading || (!branchName && commitType === "branch")}
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
