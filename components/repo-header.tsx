import {
  Box,
  StyledOcticon,
  UnderlineNav,
  Link,
  AvatarStack,
  Avatar,
} from "@primer/react";
import React from "react";
import { BiCaretDown } from "react-icons/bi";

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
  ShieldIcon,
  StarIcon,
} from "@primer/octicons-react";

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
];
const repoActions = [
  ["Unwatch", EyeIcon],
  ["Star", StarIcon],
  ["Fork", RepoForkedIcon],
];

export const RepoHeader = ({
  owner,
  repo,
  description,
  contributors = [],
}: {
  owner: string;
  repo: string;
  description: string;
  contributors: any[];
}) => {
  return (
    <Box
      bg="canvas.subtle"
      borderColor="border.default"
      borderBottomWidth={1}
      borderBottomStyle="solid"
      px={30}
      pt={20}
      className="flex-none"
    >
      <Box
        display="flex"
        alignItems="center"
        mb={2}
        justifyContent="space-between"
      >
        <Box display="flex" alignItems="center">
          <StyledOcticon
            icon={RepoIcon}
            size={17}
            mr={2}
            className="text-gray-500"
          />
          <Link
            href={`https://github.com/${owner}/`}
            fontSize={3}
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
            fontSize={3}
            fontWeight="bold"
            target="_blank"
            rel="noopener"
          >
            {repo}
          </Link>
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
          {repoActions.map(([label, Icon], i) => (
            <Box
              key={label as string}
              display="flex"
              alignItems="stretch"
              opacity={0.2}
              mx={2}
            >
              <Box
                className="hover:bg-gray-100 py-[0.4em]"
                display="flex"
                alignItems="center"
                borderColor="border.default"
                borderWidth={1}
                borderStyle="solid"
                borderTopLeftRadius={2}
                borderBottomLeftRadius={2}
                px={3}
                boxShadow="0 1px 2px 0 rgba(27,31,35,.1)"
              >
                <StyledOcticon
                  icon={Icon as any}
                  size={16}
                  mr={1}
                  className="text-gray-500"
                />
                <Box className="text-gray-700 text-xs" fontWeight="500">
                  {label}
                </Box>
                {!i && (
                  <StyledOcticon
                    icon={BiCaretDown}
                    size={15}
                    ml={1}
                    className="text-gray-500"
                  />
                )}
              </Box>
              <Box
                display="flex"
                alignItems="center"
                className="text-xs"
                borderColor="border.default"
                bg="white"
                borderWidth={1}
                borderStyle="solid"
                borderLeftWidth={0}
                borderTopRightRadius={2}
                borderBottomRightRadius={2}
                py={1}
                px={2}
                fontWeight="500"
                boxShadow="0 1px 2px 0 rgba(27,31,35,.1)"
              >
                123
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box fontSize={14} ml={4} mb={1} className="text-gray-600">
        {description}
      </Box>

      <UnderlineNav className="mb-[-1px]">
        {repoHeaderLinks.map(([label, Icon], i) => (
          <UnderlineNav.Link
            href="#"
            mx={2}
            key={label as string}
            display="flex"
            className={`items-center ${!i ? "" : "pointer-events-none"}`}
            selected={!i}
            opacity={!i ? 1 : 0.2}
          >
            <StyledOcticon
              icon={Icon as any}
              size={17}
              mr={2}
              className="text-gray-500"
            />
            <Box fontSize={1} className="!text-gray-700">
              {label}
            </Box>
          </UnderlineNav.Link>
        ))}
      </UnderlineNav>
    </Box>
  );
};
