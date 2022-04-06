import {
  GitBranchIcon,
  GitCommitIcon,
  GitPullRequestIcon,
} from "@primer/octicons-react";
import {
  Box,
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
import { useCreateBranchAndPR, useUpdateFilesContents } from "hooks";
import { QueryKeyMap } from "lib/query-keys";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import { useQueryClient } from "react-query";
import { diffAsText } from "unidiff";

interface CommitCodeDialogProps {
  onClose: () => void;
  isOpen: boolean;
  updatedContents: Record<
    string,
    { sha: string; original: string; content: string }
  >;
  repo: string;
  owner: string;
  token: string;
  branchingDisabled?: boolean;
  branchName: string;
}

type CommitType = "currentBranch" | "newBranch";

export function CommitCodeDialog(props: CommitCodeDialogProps) {
  const textInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commitType, setCommitType] = useState<CommitType>("currentBranch");
  const [newBranchName, setNewBranchName] = useState("");
  const {
    onClose,
    isOpen,
    updatedContents,
    owner,
    repo,
    token,
    branchingDisabled,
    branchName,
  } = props;
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    mutate: updateContents,
    status: updateContentsStatus,
    error: updateContentsError,
  } = useUpdateFilesContents({
    onSuccess: async (newSha) => {
      onClose();
      // TODO(jaked) invalidate just the updated ones
      await queryClient.invalidateQueries(QueryKeyMap.file.key);
      await queryClient.invalidateQueries(QueryKeyMap.timeline.key);

      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            fileRef: newSha, // TODO(jaked) correct redirect
          },
        },
        null,
        { shallow: true }
      );
    },
  });

  const {
    mutate: createBranch,
    status: createBranchStatus,
    error: createBranchError,
  } = useCreateBranchAndPR({
    onSuccess: async (res) => {
      window.open(res.html_url, "_blank");
      onClose();
      setTitle("");
      setBody("");
      setCommitType("currentBranch");
      await queryClient.refetchQueries([
        QueryKeyMap.branches.key,
        { owner, repo },
      ]);
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            branch: newBranchName,
            fileRef: res.head.sha,
          },
        },
        null,
        { shallow: true }
      );
    },
  });

  const handleCommit = () => {
    if (commitType === "newBranch") {
      try {
        /*
        createBranch({
          owner,
          repo,
          ref: newBranchName,
          token,
          title,
          body,
        });
*/
      } catch (e) {}
    } else {
      try {
        updateContents({
          owner,
          repo,
          branch: branchName,
          token,
          updatedContents,
        });
      } catch (e) {}
    }
  };

  const diffs = Object.entries(updatedContents).map(
    ([path, { original, content }]) => [
      path,
      parseDiff(diffAsText(original, content, { context: 3 }))[0],
    ]
  );

  useEffect(() => {
    if (commitType === "newBranch" && textInputRef.current) {
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
      <Dialog.Header>Editing</Dialog.Header>

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
          {diffs.map(([path, { oldRevision, newRevision, type, hunks }]) => (
            <Box>
              {path}
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
            </Box>
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
              <Radio
                checked={commitType === "currentBranch"}
                value="currentBranch"
              />

              <FormControl.Label>
                <GitCommitIcon />
                <span className="ml-1">
                  Commit directly to the{" "}
                  <BranchName className="font-normal">{branchName}</BranchName>{" "}
                  branch.
                </span>
              </FormControl.Label>
            </FormControl>
            <FormControl disabled={branchingDisabled}>
              <Radio checked={commitType === "newBranch"} value="newBranch" />
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
          {commitType === "newBranch" && (
            <div className="mt-1">
              <div className="flex flex-col gap-2">
                <FormControl>
                  <FormControl.Label visuallyHidden>
                    New branch name
                  </FormControl.Label>
                  <TextInput
                    ref={textInputRef}
                    className="font-mono"
                    leadingVisual={GitBranchIcon}
                    placeholder="New branch name"
                    value={newBranchName}
                    onChange={(e) => {
                      setNewBranchName(e.target.value);
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
          disabled={isLoading || (!newBranchName && commitType === "newBranch")}
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
