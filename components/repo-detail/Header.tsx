import { AnimatePresence, motion } from "framer-motion";
import { GitHubHeader } from "../github-header";
import { RepoHeader } from "../repo-header";

type HeaderProps = {
  isFullscreen: boolean;
  owner: string;
  repo: string;
  description?: string;
  contributors: Contributor[];
  branchName: string;
  branches: Branch[];
  canEdit: boolean;
  onChangeBranch: (branchName: string) => void;
};

export default function Header({
  isFullscreen,
  owner,
  repo,
  description,
  contributors,
  branchName,
  branches,
  canEdit,
  onChangeBranch,
}: HeaderProps) {
  return (
    <AnimatePresence initial={false}>
      {!isFullscreen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{
            height: "auto",
            transition: {
              type: "tween",
              duration: 0.1,
              delay: 0,
            },
          }}
          exit={{
            height: 0,
            transition: { type: "tween", duration: 0.1, delay: 0 },
          }}
        >
          {/* to prevent the search bar from showing on top of other content while animating */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                type: "tween",
                duration: 0,
                delay: 0,
              },
            }}
            exit={{
              opacity: 0,
              transition: { type: "tween", duration: 0, delay: 0.1 },
            }}
          >
            <GitHubHeader />
            <RepoHeader
              owner={owner}
              repo={repo}
              description={description}
              contributors={contributors}
              branchName={branchName}
              branches={branches}
              canEdit={canEdit}
              onChangeBranch={onChangeBranch}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
