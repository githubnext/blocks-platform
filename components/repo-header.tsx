import {
  Avatar,
  AvatarStack,
  Box,
  Label,
  Link,
  StyledOcticon,
  Text,
} from "@primer/react";
import { useContext } from "react";

import { LockIcon, RepoIcon } from "@primer/octicons-react";
import { AppContext } from "context";
import BranchPicker from "./branch-picker";

type RepoHeaderProps = {
  owner: string;
  repo: string;
  description: string;
  contributors: Contributor[];
  branchName: string;
  branches: Branch[];
  onChangeBranch: (branchName: string) => void;
};

export const RepoHeader = ({
  owner,
  repo,
  description,
  contributors,
  branchName,
  branches,
  onChangeBranch,
}: RepoHeaderProps) => {
  const appContext = useContext(AppContext);

  return (
    <Box
      bg="canvas.subtle"
      borderColor="border.default"
      borderBottomWidth={1}
      borderBottomStyle="solid"
      px={4}
      pt={3}
      pb={3}
      flex="none"
    >
      <Box
        display="flex"
        alignItems="center"
        mb={1}
        justifyContent="space-between"
      >
        <Box display="flex" alignItems="center" fontSize={3}>
          <StyledOcticon
            icon={RepoIcon}
            sx={{
              mr: "7px",
              mt: "4px",
              color: "fg.muted",
            }}
            size={17}
          />
          <Link
            href={`https://github.com/${owner}/`}
            target="_blank"
            rel="noopener"
          >
            {owner}
          </Link>
          <Box fontSize={3} mx={1} fontWeight={300}>
            /
          </Box>
          <Link
            href={`https://github.com/${owner}/${repo}/`}
            target="_blank"
            rel="noopener"
            sx={{ fontWeight: "bold" }}
          >
            {repo}
          </Link>
          {appContext.isPrivate && (
            <StyledOcticon
              icon={LockIcon}
              sx={{
                ml: "7px",
                mt: "3px",
                color: "fg.muted",
              }}
              size={15}
              aria-label="Private repository"
            />
          )}
          <Box ml={3}>
            <BranchPicker
              value={branchName}
              branches={branches}
              onChange={onChangeBranch}
            />
          </Box>
          {contributors && (
            <Box ml={3}>
              <AvatarStack>
                {contributors?.map((contributor) => (
                  <Avatar
                    alt={contributor.login}
                    key={contributor.login}
                    src={`https://avatars.githubusercontent.com/${contributor.login}`}
                  />
                ))}
              </AvatarStack>
            </Box>
          )}
        </Box>
      </Box>

      {description && (
        <Box fontSize={1} ml={4} mt={2} color="fg.muted">
          {description}
        </Box>
      )}

      {!appContext.hasRepoInstallation && (
        <Text fontSize={1} mt={2} color="fg.muted" display="block">
          <StyledOcticon icon={LockIcon} sx={{ mr: 2, color: "fg.muted" }} />
          The Blocks GitHub app is not installed on this repository. You won't
          be able to save changes to files or open pull-requests.{" "}
          <Link
            underline
            muted
            target="_blank"
            rel="noopener"
            href={appContext.installationUrl}
          >
            Install app
          </Link>
        </Text>
      )}
    </Box>
  );
};
