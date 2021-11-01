import { FileViewer } from "components/file-viewer-with-toggle";
import { FolderViewer } from "components/folder-viewer-with-toggle";
import { viewers } from "components/viewers";
import { octokit, useFileContent } from "hooks";
import { Box, ButtonDanger, Caret, Header, Link, Spinner, StyledOcticon, TextInput, UnderlineNav, useTheme } from "@primer/components";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getViewerFromFilename } from "lib";
import { BookIcon, CodeIcon, EyeIcon, GearIcon, GitPullRequestIcon, GraphIcon, IssueOpenedIcon, LogoGithubIcon, MarkGithubIcon, PlayIcon, ProjectIcon, RepoForkedIcon, RepoIcon, ShieldIcon, StarIcon } from "@primer/octicons-react";
import { BiCaretDown } from "react-icons/bi";
import { Sidebar } from "components/Sidebar"
import { Tooltip } from "components/Tooltip";
import { Avatar, AvatarList } from "components/Avatar";
import { ActivityFeed } from "components/ActivityFeed";

export default function IndexPage() {
  const router = useRouter();
  const { setColorMode } = useTheme();
  const { repo, owner, path = "README.md", theme, fileRef, viewerOverride } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [fileChanges, setFileChanges] = useState({})
  const [repoInfo, setRepoInfo] = useState({});
  const [activity, setActivity] = useState([]);
  const [commits, setCommits] = useState([]);

  // we'll want to update this at some point
  const isFolder = !path.includes(".")
  const { data: folderData, status } = useFileContent(
    {
      repo: repo as string,
      owner: owner as string,
      path: path as string,
      fileRef: fileRef as string,
    },
    {
      enabled: Boolean(repo) && Boolean(owner) && Boolean(path),
      refetchOnWindowFocus: false,
    }
  );
  const data = folderData?.[0]
  const defaultViewer = isFolder ? "sidebar" : getViewerFromFilename(data?.name) || "code";

  useEffect(() => {
    setColorMode(theme === "dark" ? "night" : "day");
  }, [theme]);

  const getFiles = async () => {
    if (!owner || !repo) return
    const url = `/api/repo-info?owner=${owner}&repo=${repo}`
    const { files, repoInfo, activity, commits, fileChanges } = await fetch(url).then(res => res.json());
    console.log({ files, repoInfo, activity, commits, fileChanges })
    setFiles(files);
    setRepoInfo(repoInfo);
    setFileChanges(fileChanges)
    setCommits(commits);
    setActivity(activity);
    setIsLoading(false)
  }

  useEffect(() => {
    getFiles()
  }, [owner, repo]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const extension = (path as string)?.split(".").slice(-1)[0];
    const relevantViewers = viewers.filter(viewer => (
      viewer.extensions.includes(extension) || viewer.extensions.includes("*")
    ))
      .map((v) => ({ id: v.id, label: v.label }))
      .sort((a, b) => (a.id === defaultViewer) ? -1 : 1); // put default viewer first
  }, [path, defaultViewer]);

  const findNestedItem = (path: string, files: any) => {
    const nextItemName = path.split("/")[0]
    const nextItem = files.find(item => item.name === nextItemName)
    const nextPath = path.split("/").slice(1).join("/")
    return nextPath ? findNestedItem(nextPath, nextItem?.children || []) : nextItem
  }
  const folderFiles = useMemo(() => (
    isFolder && findNestedItem(path as string, files)?.children || []
  ), [isFolder, files]);

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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="animate-pulse flex space-y-4">
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                <div className="rounded-full bg-gray-200 h-12 w-full"></div>
              </div>
            </div>
          ) : (
            <Sidebar
              files={files}
              activeFilePath={path as string}
              fileChanges={fileChanges}
            />
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {status === "loading" && <p className="text-sm w-full p-8">Loading...</p>}
          {status === "success" && (
            isFolder ? (
              <FolderViewer
                theme={theme as string || "light"}
                path={path as string}
                data={folderFiles}
                defaultViewer={defaultViewer}
                viewerOverride={viewerOverride as string}
                hasToggle
              />
            ) : (
              <FileViewer
                theme={theme as string || "light"}
                data={data}
                defaultViewer={defaultViewer}
                viewerOverride={viewerOverride as string}
                hasToggle
              />
            )
          )}
        </div>

        <div className="flex-none w-80 h-full border-l border-gray-200">
          {isLoading ? (
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
      <Footer />
    </div>

  );
}


const links = [
  "Pull requests",
  "Issues",
  "Marketplace",
  "Explore",
]
const GitHubHeader = () => {
  return (
    <Header px={30} className="flex-none">
      <Header.Item>
        <Header.Link href="#" fontSize={2}>
          <StyledOcticon icon={MarkGithubIcon} size={32} mr={2} />
        </Header.Link>
      </Header.Item>
      <Header.Item full>
        <TextInput width="20em" aria-label="searchbar" name="zipcode" placeholder="Search or jump to..."
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
      </Header.Item>
    </Header>
  )
}

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
]
const repoActions = [
  ["Unwatch", EyeIcon],
  ["Star", StarIcon],
  ["Fork", RepoForkedIcon],
]
const RepoHeader = ({ owner, repo, description, contributors }: {
  owner: string,
  repo: string,
  description: string,
  contributors: [string, string, string][]
}) => {
  return (
    <Box bg="canvas.subtle" borderColor="border.default" borderBottomWidth={1} borderBottomStyle="solid" px={30} pt={20} className="flex-none">
      <Box display="flex" alignItems="center" mb={2} justifyContent="space-between">
        <Box display="flex" alignItems="center" >
          <StyledOcticon icon={RepoIcon} size={17} mr={2} className="text-gray-500" />
          <Link href="#" fontSize={3}>
            {owner}
          </Link>
          <Box fontSize={3} mx={1} fontWeight={300}>/</Box>
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

        <Box display="flex" alignItems="center" >
          {repoActions.map(([label, Icon], i) => (
            <Box key={label as string} display="flex" alignItems="stretch" mx={2}>
              <Box
                className="hover:bg-gray-100 cursor-pointer py-[0.4em]"
                display="flex" alignItems="center" borderColor="border.default" borderWidth={1} borderStyle="solid" borderTopLeftRadius={2} borderBottomLeftRadius={2} px={3} boxShadow="0 1px 2px 0 rgba(27,31,35,.1)">
                <StyledOcticon icon={Icon as any} size={16} mr={1} className="text-gray-500" />
                <Box className="text-gray-700 text-xs" fontWeight="500">
                  {label}
                </Box>
                {!i && (
                  <StyledOcticon icon={BiCaretDown} size={15} ml={1} className="text-gray-500" />
                )}
              </Box>
              <Box display="flex" alignItems="center"
                className="text-xs"
                borderColor="border.default"
                bg="white" borderWidth={1} borderStyle="solid"
                borderLeftWidth={0}
                borderTopRightRadius={2} borderBottomRightRadius={2} py={1} px={2} fontWeight="500" boxShadow="0 1px 2px 0 rgba(27,31,35,.1)">
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
          <UnderlineNav.Link href="#" mx={2} key={label as string} display="flex" className="items-center" selected={!i}>
            <StyledOcticon icon={Icon as any} size={17} mr={2} className="text-gray-500" />
            <Box fontSize={1} className="!text-gray-700">
              {label}
            </Box>
          </UnderlineNav.Link>
        ))}
      </UnderlineNav>
    </Box>
  )
}

const footerLinks = [
  ["Terms", "https://docs.github.com/en/github/site-policy/github-terms-of-service"],
  ["Privacy", "https://docs.github.com/en/github/site-policy/github-privacy-statement"],
  ["Security", "https://github.com/security"],
  ["Status", "https://www.githubstatus.com/"],
  ["Docs", "https://docs.github.com"],
  ["Contact GitHub", "https://support.github.com?tags=dotcom-footer"],
  ["Pricing", "https://github.com/pricing"],
  ["API", "https://docs.github.com"],
  ["Training", "https://services.github.com"],
  ["Blog", "https://github.blog"],
  ["About", "https://github.com/about"],
]
const Footer = () => {
  return (
    <Box display="flex" alignItems="center" py={20} borderTopWidth={1} borderTopStyle="solid" borderTopColor="border.default" className="flex-none max-w-[1250px] mx-10 self-center" style={{
      width: "calc(100% - 5em)"
    }}>
      <Box display="flex" alignItems="center" mr={2} className="text-gray-500">
        <StyledOcticon icon={MarkGithubIcon} size={25} mr={2} />
        <div className="text-xs">© 2021 GitHub, Inc.</div>
      </Box>
      <Box display="flex" alignItems="center" flex="1" justifyContent="space-evenly" className="max-w-[70em]">
        {footerLinks.map(([label, href]) => (
          <Box key={label} display="flex" alignItems="center" mx={2}>
            <Link href={href} className="text-xs">
              {label}
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  )
}