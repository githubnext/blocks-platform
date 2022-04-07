import {
  Box,
  StyledOcticon,
  UnderlineNav,
  Link,
  AvatarStack,
  Avatar,
  Button,
} from "@primer/react";
import React from "react";

import {
  BookIcon,
  CodeIcon,
  EyeIcon,
  GearIcon,
  GitPullRequestIcon,
  GraphIcon,
  IssueOpenedIcon,
  PlayIcon,
  ProjectIcon,
  RepoForkedIcon,
  RepoIcon,
  RepoPushIcon,
  ShieldIcon,
  StarIcon,
} from "@primer/octicons-react";
import BranchPicker from "./branch-picker";

const repoHeaderLinks = [
  ["Code", CodeIcon],
  ["Issues", IssueOpenedIcon],
  ["Pull requests", GitPullRequestIcon],
  ["Actions", PlayIcon],
  ["Projects", ProjectIcon],
  ["Wiki", BookIcon],
  ["Security", ShieldIcon],
  ["Insights", GraphIcon],
  ["Settings", GearIcon],
] as const;

const repoActions = [
  ["Unwatch", EyeIcon],
  ["Fork", RepoForkedIcon],
  ["Star", StarIcon],
] as const;

type RepoHeaderProps = {
  owner: string;
  repo: string;
  description: string;
  contributors: Contributor[];
  branchName: string;
  branches: Branch[];
  onChangeBranch: (branchName: string) => void;
  onSaveChanges?: () => void;
};

export const RepoHeader = ({
  owner,
  repo,
  description,
  contributors,
  branchName,
  branches,
  onChangeBranch,
  onSaveChanges,
}: RepoHeaderProps) => {
  return (
    <Box
      bg="canvas.subtle"
      borderColor="border.default"
      borderBottomWidth={1}
      borderBottomStyle="solid"
      px={4}
      pt={3}
      flex="none"
    >
      <Box
        display="flex"
        alignItems="center"
        mb={2}
        justifyContent="space-between"
      >
        <Box display="flex" alignItems="center" fontSize={3}>
          <StyledOcticon
            icon={RepoIcon}
            sx={{
              mr: 2,
              color: "fg.muted",
            }}
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
          <Box ml={2}>
            <BranchPicker
              value={branchName}
              branches={branches}
              onChange={onChangeBranch}
            />
          </Box>
          <Box ml={2}>
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
        </Box>

        <Box display="flex" alignItems="center">
          <Button
            key={"Save Changes"}
            leadingIcon={RepoPushIcon}
            size="small"
            disabled={!onSaveChanges}
            onClick={onSaveChanges}
            sx={{ ml: 2 }}
          >
            Save Changes
          </Button>
          {repoActions.map(([label, Icon], i) => (
            <Button
              key={label}
              leadingIcon={Icon}
              size="small"
              disabled
              sx={{ ml: 2 }}
            >
              {label}
            </Button>
          ))}
        </Box>
      </Box>

      <Box fontSize={1} ml={4} mb={1} color="fg.muted">
        {description ?? "\u00a0"}
      </Box>

      <UnderlineNav sx={{ mb: "-1px" }}>
        {repoHeaderLinks.map(([label, Icon], i) => (
          <UnderlineNav.Link
            href="#"
            key={label}
            selected={!i}
            sx={{
              mx: 2,
              display: "flex",
              alignItems: "center",
              pointerEvents: !i ? "initial" : "none",
              opacity: !i ? 1 : 0.2,
              lineHeight: 1,
            }}
          >
            <StyledOcticon
              icon={Icon}
              sx={{
                mr: 2,
                color: "fg.muted",
              }}
            />
            {label}
          </UnderlineNav.Link>
        ))}
      </UnderlineNav>
    </Box>
  );
};
