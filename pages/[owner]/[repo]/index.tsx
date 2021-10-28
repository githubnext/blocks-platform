import { FileViewer } from "components/file-viewer-with-toggle";
import { viewers } from "components/viewers";
import { octokit, useFileContent } from "hooks";
import { Avatar, Box, ButtonDanger, Caret, Header, Link, StyledOcticon, TextInput, UnderlineNav, useTheme } from "@primer/components";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getViewerFromFilename } from "lib";
import { BookIcon, CodeIcon, EyeIcon, GearIcon, GitPullRequestIcon, GraphIcon, IssueOpenedIcon, LogoGithubIcon, MarkGithubIcon, PlayIcon, ProjectIcon, RepoForkedIcon, RepoIcon, ShieldIcon, StarIcon } from "@primer/octicons-react";
import { BiCaretDown } from "react-icons/bi";
import { Sidebar } from "components/Sidebar"

export default function IndexPage() {
  const router = useRouter();
  const { setColorMode } = useTheme();
  const { repo, owner, path = "README.md", theme, fileRef, viewerOverride } = router.query;
  const [files, setFiles] = useState([]);
  const [fileChanges, setFileChanges] = useState({})
  const [commits, setCommits] = useState([]);
  const { data, status } = useFileContent(
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
  const defaultViewer = getViewerFromFilename(data?.name) || "code";
  console.log("defaultViewer: ", defaultViewer);

  useEffect(() => {
    setColorMode(theme === "dark" ? "night" : "day");
  }, [theme]);

  const getFiles = async () => {
    if (!owner || !repo) return
    const url = `/api/get-tree?owner=${owner}&repo=${repo}`
    const { files, commits, fileChanges } = await fetch(url).then(res => res.json());
    console.log({ files, commits, fileChanges })
    setFiles(files);
    setFileChanges(fileChanges)
    setCommits(commits);
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

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <GitHubHeader />
      <RepoHeader owner={owner as string} repo={repo as string} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-none w-80">
          <Sidebar
            files={files}
            activeFilePath={path}
            fileChanges={fileChanges}
            owner={owner as string}
            repo={repo as string}
          />
        </div>

        <div className="flex-1">
          {status === "loading" && <p className="text-sm w-full p-8">Loading...</p>}
          {status === "success" && (
            <FileViewer
              theme={theme as string || "light"}
              data={data}
              defaultViewer={defaultViewer}
              viewerOverride={viewerOverride as string}
              hasToggle
            />
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
        <Avatar src="https://github.com/octocat.png" size={20} square alt="@octocat" />
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
const RepoHeader = ({ owner, repo }: {
  owner: string,
  repo: string,
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
    <Box display="flex" alignItems="center" py={40} borderTopWidth={1} borderTopStyle="solid" borderTopColor="border.default" className="flex-none mt-10 max-w-[1250px] mx-10 self-center" style={{
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