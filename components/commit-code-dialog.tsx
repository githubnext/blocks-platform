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
  Link,
  Radio,
  RadioGroup,
  Text,
  Textarea,
  TextInput,
} from "@primer/react";
import { useCreateBranchAndPR, useUpdateFileContents } from "hooks";
import { QueryKeyMap } from "lib/query-keys";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import { useQueryClient } from "react-query";
import { diffAsText } from "unidiff";
import type { BlocksQueryMeta } from "ghapi";
import makeBranchPath from "utils/makeBranchPath";

interface CommitCodeDialogProps {
  onCommit: () => void;
  onCancel: () => void;
  isOpen: boolean;
  newCode: string;
  currentCode?: string;
  path: string;
  repo: string;
  owner: string;
  branchingDisabled: boolean;
  branchName: string;
}

type CommitType = "currentBranch" | "newBranch";

export function CommitCodeDialog(props: CommitCodeDialogProps) {
  const textInputRef = useRef(null);
  const [commitTitle, setCommitTitle] = useState(`Update ${props.path}`);
  const [commitDescription, setCommitDescription] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [commitType, setCommitType] = useState<CommitType>("currentBranch");
  const [newBranchName, setNewBranchName] = useState(`patch`);
  const {
    onCommit,
    onCancel,
    isOpen,
    currentCode,
    newCode,
    path,
    owner,
    repo,
    branchingDisabled,
    branchName,
  } = props;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, userToken } = queryClient.getDefaultOptions().queries
    .meta as BlocksQueryMeta;

  const {
    mutate: updateContents,
    status: updateContentsStatus,
    error: updateContentsError,
  } = useUpdateFileContents({
    onSuccess: async (newSha) => {
      onCommit();
      await queryClient.invalidateQueries(QueryKeyMap.file.key);
      await queryClient.invalidateQueries(QueryKeyMap.timeline.key);
    },
  });

  const {
    mutate: createBranch,
    status: createBranchStatus,
    error: createBranchError,
  } = useCreateBranchAndPR({
    onSuccess: async (res) => {
      window.open(res.html_url, "_blank");
      onCommit();
      setPrTitle("");
      setPrDescription("");
      setCommitTitle("");
      setCommitDescription("");
      setNewBranchName("");
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
            branchPath: makeBranchPath(
              res.head.ref,
              router.query.branchPath[1] || path
            ),
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
        createBranch({
          owner,
          repo,
          sourceBranch: branchName,
          ref: newBranchName,
          token,
          userToken,
          content: newCode,
          path,
          title: prTitle,
          body: prDescription,
          commitMessage: `${commitTitle}\n\n${commitDescription}`,
        });
      } catch (e) {}
    } else {
      try {
        updateContents({
          owner,
          repo,
          branch: branchName,
          ref: branchName,
          token,
          userToken,
          content: newCode,
          path,
          message: `${commitTitle}\n\n${commitDescription}`,
        });
      } catch (e) {}
    }
  };
  const files = useMemo(
    () => parseDiff(diffAsText(currentCode, newCode)),
    [currentCode, newCode]
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
      onDismiss={onCancel}
    >
      <Dialog.Header>
        {commitType === "currentBranch" ? "Commit" : "Propose"} changes to{" "}
        {path}
      </Dialog.Header>

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
        <div className="mt-4 space-y-3">
          <FormControl>
            <FormControl.Label visuallyHidden>Commit Title</FormControl.Label>
            <TextInput
              placeholder="Commit Title"
              value={commitTitle}
              className="w-full"
              onChange={(e) => {
                setCommitTitle(e.target.value);
              }}
            />
          </FormControl>
          <FormControl>
            <FormControl.Label visuallyHidden>
              Commit Description
            </FormControl.Label>
            <Textarea
              placeholder="Add an optional extended description..."
              sx={{ width: "100%" }}
              rows={4}
              value={commitDescription}
              onChange={(e) => {
                setCommitDescription(e.target.value);
              }}
            />
          </FormControl>
          <RadioGroup
            sx={{ mt: 3 }}
            disabled={isLoading}
            name="choiceGroup"
            onChange={(value) => {
              setCommitType(value as CommitType);
            }}
          >
            <FormControl>
              <Radio
                checked={commitType === "currentBranch"}
                value="currentBranch"
              />
              <FormControl.Label sx={{ fontWeight: 400 }}>
                <GitCommitIcon />
                <span className="ml-1">
                  Commit directly to the{" "}
                  <BranchName className="font-normal">{branchName}</BranchName>{" "}
                  branch.
                </span>
              </FormControl.Label>
            </FormControl>
            <FormControl disabled={branchingDisabled}>
              <RadioGroup.Label visuallyHidden>Commit changes</RadioGroup.Label>
              <Radio checked={commitType === "newBranch"} value="newBranch" />
              <FormControl.Label sx={{ fontWeight: 400 }}>
                <GitPullRequestIcon />
                <span className="ml-1">
                  Create a <strong>new branch</strong> for this commit and start
                  a pull request.{" "}
                  <Link
                    href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests"
                    target="_blank"
                  >
                    Learn more about branches.
                  </Link>
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
            <div className="mt-1 pl-5">
              <div className="flex flex-col gap-2">
                <FormControl>
                  <FormControl.Label visuallyHidden>
                    New branch name
                  </FormControl.Label>
                  <TextInput
                    ref={textInputRef}
                    className="font-mono"
                    sx={{ width: "100%" }}
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
                    className="w-full"
                    placeholder="Pull request title"
                    value={prTitle}
                    onChange={(e) => {
                      setPrTitle(e.target.value);
                    }}
                  />
                </FormControl>
                <FormControl>
                  <FormControl.Label visuallyHidden>
                    PR Description
                  </FormControl.Label>
                  <Textarea
                    placeholder="Pull request description"
                    sx={{ width: "100%" }}
                    rows={4}
                    value={prDescription}
                    onChange={(e) => {
                      setPrDescription(e.target.value);
                    }}
                  />
                </FormControl>
              </div>
            </div>
          )}
        </div>
      </div>
      <footer className="p-4 border-t flex items-center justify-end gap-2">
        <Button disabled={isLoading} variant="danger" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={
            isLoading ||
            (commitType === "newBranch" && (!newBranchName || !prTitle))
          }
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
