import {
  Box,
  Button, Link, StyledOcticon, UnderlineNav
} from "@primer/components";
import {
  BookIcon,
  CodeIcon, EyeIcon,
  GearIcon, GitPullRequestIcon, GraphIcon,
  IssueOpenedIcon, PlayIcon, ProjectIcon,
  RepoForkedIcon, RepoIcon, ShieldIcon,
  StarIcon
} from "@primer/octicons-react";
import { Avatar, AvatarList } from "components/Avatar";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { BiCaretDown } from "react-icons/bi";

export const repoHeaderLinks = [
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
export const repoActions = [
  ["Unwatch", EyeIcon],
  ["Star", StarIcon],
  ["Fork", RepoForkedIcon],
];

export const RepoHeader = ({
  owner, repo, description, contributors, isEditing, setIsEditing,
}: {
  owner: string;
  repo: string;
  description: string;
  contributors: [string, string, string][];
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}) => {
  const router = useRouter();
  const { branch } = router.query;

  return (
    <Box
      bg="canvas.subtle"
      borderColor="border.default"
      borderBottomWidth={1}
      borderBottomStyle="solid"
      px={30}
      pt={isEditing ? 3 : 4}
      pb={isEditing ? 2 : 0}
      className="relative flex-none z-10"
      overflow="hidden"
    >
      <Box
        display="flex"
        alignItems="center"
        mb={2}
        justifyContent="space-between"
        className="relative"
        zIndex={10}
      >
        <Box display="flex" alignItems="center" className="whitespace-nowrap">
          <StyledOcticon
            icon={RepoIcon}
            size={17}
            mr={2}
            className="text-gray-500" />
          <Link href="#" fontSize={3}>
            {owner}
          </Link>
          <Box fontSize={3} mx={1} fontWeight={300}>
            /
          </Box>
          <Link href="#" fontSize={3} fontWeight="bold">
            {repo}
          </Link>
          {isEditing ? (
            <div className="text-lg text-black ml-2 font-semibold">
              {branch || "new branch"}
            </div>
          ) : (
            <Box ml={2}>
              <AvatarList>
                {contributors?.map((contributor) => (
                  <Avatar username={contributor[0]} size="small" />
                ))}
              </AvatarList>
            </Box>
          )}
        </Box>

        <AnimatePresence>
          {isEditing ? (
            <motion.div key="nav" className="flex items-center w-full z-10"
              initial={{ opacity: 0, x: 20, position: "absolute" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, position: "absolute" }}
              transition={{ duration: 0.6 }}
            >
              <Box display="flex" alignItems="center" ml="auto">
                <Button mr={2} fontSize={1} display="flex">
                  <div className="mr-2">
                    <GitPullRequestIcon />
                  </div>
                  Create a PR</Button>
                <Button
                  fontSize={1}
                  onClick={() => {
                    const { branch, ...newQuery } = router.query;
                    router.push({
                      pathname: router.pathname,
                      query: newQuery
                    }, undefined, { shallow: true });
                    setIsEditing(false);
                  }}
                  mr={2}
                >
                  Stop editing
                </Button>
              </Box>
            </motion.div>
          ) : (
            <motion.div key="actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6 }}
            >
              <Box display="flex" alignItems="center">
                {repoActions.map(([label, Icon], i) => (
                  <Box
                    key={label as string}
                    display="flex"
                    alignItems="stretch"
                    mx={2}
                  >
                    <Box
                      className="hover:bg-gray-100 cursor-pointer py-[0.4em]"
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
                        className="text-gray-500" />
                      <Box className="text-gray-700 text-xs" fontWeight="500">
                        {label}
                      </Box>
                      {!i && (
                        <StyledOcticon
                          icon={BiCaretDown}
                          size={15}
                          ml={1}
                          className="text-gray-500" />
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
                      {Math.round(Math.random() * 100)}
                    </Box>
                  </Box>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <Box fontSize={14} ml={4} mb={1} className="text-gray-600 z-10">
        {description}
      </Box>
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-100 z-0" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isEditing && (
          <motion.div key="nav" className="w-full"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box display="flex" alignItems="center">
              <UnderlineNav className="mb-[-1px]">
                {repoHeaderLinks.map(([label, Icon], i) => (
                  <UnderlineNav.Link
                    href="#"
                    mx={2}
                    key={label as string}
                    display="flex"
                    className="items-center"
                    selected={!i}
                  >
                    <StyledOcticon
                      icon={Icon as any}
                      size={17}
                      mr={2}
                      className="text-gray-500" />
                    <Box fontSize={1} className="!text-gray-700">
                      {label}
                    </Box>
                  </UnderlineNav.Link>
                ))}
              </UnderlineNav>
              <Button ml="auto" fontSize={1}
                onClick={() => {
                  router.push({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      branch: "active-branch"
                    }
                  });
                }}
              >Start editing</Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};
