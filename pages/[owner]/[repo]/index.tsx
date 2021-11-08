import { FileViewer } from "components/file-viewer-with-toggle";
import { FolderViewer } from "components/folder-viewer-with-toggle";
import { viewers } from "components/viewers";
import { octokit, useFileContent } from "hooks";
import {
  Box,
  ButtonDanger,
  Caret,
  Header,
  Link,
  Spinner,
  StyledOcticon,
  TextInput,
  UnderlineNav,
  useTheme,
} from "@primer/components";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getViewerFromFilename } from "lib";
import {
  BookIcon,
  CodeIcon,
  EyeIcon,
  GearIcon,
  GitPullRequestIcon,
  GraphIcon,
  IssueOpenedIcon,
  LogoGithubIcon,
  MarkGithubIcon,
  PlayIcon,
  ProjectIcon,
  RepoForkedIcon,
  RepoIcon,
  ShieldIcon,
  StarIcon,
} from "@primer/octicons-react";
import { BiCaretDown } from "react-icons/bi";
import { Sidebar } from "components/Sidebar";
import { Tooltip } from "components/Tooltip";
import { Avatar, AvatarList } from "components/Avatar";
import { ActivityFeed } from "components/ActivityFeed";

export default function IndexPage() {
  const router = useRouter();
  const { setColorMode } = useTheme();
  const {
    repo,
    owner,
    path = "",
    theme,
    fileRef,
    viewerOverride,
  } = router.query;
  const [isLoadingRepoInfo, setIsLoadingRepoInfo] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [files, setFiles] = useState([]);
  const [fileChanges, setFileChanges] = useState({});
  const [repoInfo, setRepoInfo] = useState({});
  const [activity, setActivity] = useState([]);
  const [commits, setCommits] = useState([]);

  // we'll want to update this at some point
  const { data: folderData, status } = useFileContent(
    {
      repo: repo as string,
      owner: owner as string,
      path: path as string,
      fileRef: fileRef as string,
    },
    {
      enabled: Boolean(repo) && Boolean(owner),
      refetchOnWindowFocus: false,
    }
  );
  const isFolder = status !== "success" ? false : folderData?.[0]?.path !== path;
  const data = folderData?.[0];
  const defaultViewer = isFolder
    ? "readme"
    : getViewerFromFilename(data?.name) || "code";

  useEffect(() => {
    setColorMode(theme === "dark" ? "night" : "day");
  }, [theme]);

  const getRepoInfo = async () => {
    if (!owner || !repo) return
    const url = `/api/repo-info?owner=${owner}&repo=${repo}`
    const { repoInfo, activity, commits, fileChanges } = await fetch(url).then(res => res.json());
    // console.log({ repoInfo, activity, commits, fileChanges })
    setRepoInfo(repoInfo);
    setFileChanges(fileChanges);
    setCommits(commits);
    setActivity(activity);
    setIsLoadingRepoInfo(false)
  }
  const getFiles = async () => {
    const url = `/api/file-tree?owner=${owner}&repo=${repo}`
    const { files } = await fetch(url).then(res => res.json());
    setFiles(files);
    setIsLoadingFiles(false)
    // console.log({ files })
  }

  useEffect(() => {
    getRepoInfo()
  }, [owner, repo]);

  useEffect(() => {
    getFiles()
  }, [owner, repo, path]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const extension = (path as string)?.split(".").slice(-1)[0];
    const relevantViewers = viewers
      .filter(
        (viewer) =>
          viewer.extensions.includes(extension) ||
          viewer.extensions.includes("*")
      )
      .map((v) => ({ id: v.id, label: v.label }))
      .sort((a, b) => (a.id === defaultViewer ? -1 : 1)); // put default viewer first
  }, [path, defaultViewer]);

  const findNestedItem = (path: string, files: any) => {
    const nextItemName = path.split("/")[0];
    const nextItem = files.find((item) => item.name === nextItemName);
    const nextPath = path.split("/").slice(1).join("/");
    return nextPath
      ? findNestedItem(nextPath, nextItem?.children || [])
      : nextItem;
  };
  const folderFiles = useMemo(
    () => (isFolder && path ? (findNestedItem(path as string, files)?.children) : files) || [],
    [isFolder, files]
  );

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <GitHubHeader />
      <RepoHeader
        owner={owner as string}
        repo={repo as string}
        // @ts-ignore
        description={repoInfo.description}
        // @ts-ignore
        contributors={repoInfo.contributors}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-none w-80 border-r border-gray-200">
          {isLoadingFiles ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="animate-pulse flex space-y-4">
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
              </div>
            </div>
          ) : (
            <Sidebar
              owner={owner as string}
              repo={repo as string}
              files={files}
              activeFilePath={path as string}
              fileChanges={fileChanges}
            />
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {status === "loading" && (
            <p className="text-sm w-full p-8">Loading...</p>
          )}
          {status === "success" &&
            (isFolder ? (
              <FolderViewer
                theme={(theme as string) || "light"}
                path={path as string}
                data={folderFiles}
                defaultViewer={defaultViewer}
                viewerOverride={viewerOverride as string}
                hasToggle
              />
            ) : (
              <FileViewer
                theme={(theme as string) || "light"}
                data={data}
                defaultViewer={defaultViewer}
                viewerOverride={viewerOverride as string}
                hasToggle
              />
            ))}
        </div>

        <div className="flex-none w-80 h-full border-l border-gray-200">
          {isLoadingRepoInfo ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="animate-pulse flex space-y-4">
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
              </div>
            </div>
          ) : (
            <ActivityFeed activity={activity} />
          )}
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
}

const logo = (
  <svg viewBox="0 0 717 506" fill="none" width="2em" fill="#fff">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M66.748 263.288C66.748 122.245 181 8 322.051 8C427.499 8 517.97 71.8461 556.932 163.018C531.124 178.951 504.106 193.672 476.531 207.194C472.164 197.632 466.322 189.016 459.288 181.294C461.841 174.912 470.777 148.749 456.735 113.643C456.735 113.643 435.351 106.627 386.527 139.814C365.743 134.047 344.269 131.148 322.701 131.196C301.132 131.152 279.659 134.051 258.875 139.814C210.051 106.944 188.667 113.643 188.667 113.643C174.626 148.749 183.561 174.912 186.114 181.294C169.837 199.165 159.942 222.14 159.942 249.905C159.942 274.768 163.789 294.728 170.463 310.776C130.861 318.769 97.4625 323.111 73.9627 323.877C69.2471 304.466 66.748 284.177 66.748 263.288ZM77.0729 335.474C100.61 415.594 162.366 479.178 241.314 505.494C254.079 507.73 258.868 500.071 258.868 493.372C258.868 491.264 258.829 487.46 258.779 482.497C258.685 473.178 258.55 459.772 258.55 445.826C194.408 457.631 177.813 430.192 172.707 415.834C169.837 408.493 157.389 385.834 146.534 379.777C137.599 374.988 124.834 363.183 146.217 362.866C166.324 362.549 180.683 381.37 185.472 389.037C208.449 427.647 245.151 416.801 259.827 410.102C262.063 393.508 268.763 382.337 276.104 375.955C238.001 371.674 198.753 360.36 177.038 323.908C134.008 331.231 99.1656 334.629 77.0729 335.474ZM483.398 228.491C484.75 235.248 485.461 242.382 485.461 249.905C485.461 347.874 425.782 369.573 368.981 375.955C378.233 383.931 386.218 399.248 386.218 423.183C386.218 445.912 386.077 465.669 385.983 478.882C385.935 485.52 385.9 490.506 385.9 493.388C385.9 500.087 390.689 508.071 403.454 505.51C504.299 471.688 577.377 375.947 577.377 263.304C577.372 235.82 573.032 209.354 565.001 184.553C538.262 200.791 510.896 215.387 483.398 228.491Z" fill="currentColor" />
    <path fill-rule="evenodd" clip-rule="evenodd" d="M627.887 88.2373C630.273 90.6257 632.127 93.4903 633.331 96.644C634.534 99.7978 635.059 103.17 634.871 106.54C634.683 109.91 633.786 113.203 632.239 116.203C630.693 119.204 628.531 121.844 625.895 123.952C449.857 265.101 171.657 327.01 58.65 327.01C27.42 327.01 0.73999 319 0.73999 302.75C0.73999 284.352 25.3794 262.265 88.7448 229.236C89.7516 228.71 90.9171 228.575 92.0177 228.856C93.1183 229.137 94.0763 229.814 94.7081 230.758V230.758C95.0702 231.301 95.3124 231.916 95.4187 232.56C95.525 233.205 95.493 233.864 95.3247 234.495C95.1565 235.126 94.8559 235.714 94.4429 236.22C94.0299 236.726 93.5139 237.138 92.9293 237.43C42.0727 262.786 12.75 287.9 12.75 301.09C12.75 307.88 25.5 311.02 50.5 311.02C96.8157 311.02 384.018 267.245 595.392 86.9272C599.981 83.0198 605.874 80.9847 611.896 81.2275C617.918 81.4703 623.628 83.9731 627.887 88.2373H627.887Z" fill="currentColor" />
    <path d="M716.906 53.0818C681.146 63.2978 673.203 71.8584 663.822 106.164C654.44 71.8584 646.497 63.2978 610.737 53.0818C646.497 42.8657 654.44 34.3052 663.822 0C673.203 34.3052 681.146 42.8657 716.906 53.0818Z" fill="#6BD6D0" />
  </svg>
)
const links = ["Pull requests", "Issues", "Marketplace", "Explore"];
const GitHubHeader = () => {
  return (
    <Header px={30} className="flex-none">
      <Header.Item>
        <Header.Link href="#" fontSize={2}>
          {logo}
        </Header.Link>
      </Header.Item>

      <Header.Item full>
        This is a prototype. More information about this project <a href="" className="underline ml-1"> can be found here</a>
      </Header.Item>

      {/* <Header.Item full>
        <TextInput
          width="20em"
          aria-label="searchbar"
          name="zipcode"
          placeholder="Search or jump to..."
          className="!border !border-gray-600"
        />
        <Box display="flex" alignItems="center" ml={2}>
          {links.map((link) => (
            <Header.Link href="#" fontSize={1} key={link} mx={2}>
              {link}
            </Header.Link>
          ))}
        </Box>
      </Header.Item>
      <Header.Item mr={0}>
        <Avatar username="mona" size="small" />
      </Header.Item> */}
    </Header>
  );
};

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
const RepoHeader = ({
  owner,
  repo,
  description,
  contributors,
}: {
  owner: string;
  repo: string;
  description: string;
  contributors: [string, string, string][];
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
          <Link href="#" fontSize={3}>
            {owner}
          </Link>
          <Box fontSize={3} mx={1} fontWeight={300}>
            /
          </Box>
          <Link href="#" fontSize={3} fontWeight="bold">
            {repo}
          </Link>
          <Box ml={2}>
            <AvatarList>
              {contributors?.map((contributor) => (
                <Avatar username={contributor[0]} size="small" />
              ))}
            </AvatarList>
          </Box>
        </Box>

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
                {Math.round(Math.random() * 100)}
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

const footerLinks = [
  [
    "Terms",
    "https://docs.github.com/en/github/site-policy/github-terms-of-service",
  ],
  [
    "Privacy",
    "https://docs.github.com/en/github/site-policy/github-privacy-statement",
  ],
  ["Security", "https://github.com/security"],
  ["Status", "https://www.githubstatus.com/"],
  ["Docs", "https://docs.github.com"],
  ["Contact GitHub", "https://support.github.com?tags=dotcom-footer"],
  ["Pricing", "https://github.com/pricing"],
  ["API", "https://docs.github.com"],
  ["Training", "https://services.github.com"],
  ["Blog", "https://github.blog"],
  ["About", "https://github.com/about"],
];
const Footer = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      py={20}
      borderTopWidth={1}
      borderTopStyle="solid"
      borderTopColor="border.default"
      className="flex-none max-w-[1250px] mx-10 self-center"
      style={{
        width: "calc(100% - 5em)",
      }}
    >
      <Box display="flex" alignItems="center" mr={2} className="text-gray-500">
        <StyledOcticon icon={MarkGithubIcon} size={25} mr={2} />
        <div className="text-xs">© 2021 GitHub, Inc.</div>
      </Box>
      <Box
        display="flex"
        alignItems="center"
        flex="1"
        justifyContent="space-evenly"
        className="max-w-[70em]"
      >
        {footerLinks.map(([label, href]) => (
          <Box key={label} display="flex" alignItems="center" mx={2}>
            <Link href={href} className="text-xs">
              {label}
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
