import {
  ChevronRightIcon,
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  FileIcon,
  LogoGithubIcon,
  MarkGithubIcon,
} from "@primer/octicons-react";
import { GradientBadge } from "components/gradient-badge";
import { NextOctocat } from "components/next-octocat";
import { range } from "d3";
import type { GetServerSidePropsContext } from "next";
import getConfig from "next/config";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useRef, useState } from "react";
import { Box, StyledOcticon } from "@primer/react";
import useBlockFrameMessages from "components/repo-detail/use-block-frame-messages";
import { makeGitHubAPIInstance, makeOctokitInstance } from "ghapi";
import { useQueryClient } from "react-query";
import { AppContext } from "context";
import { VscFolder } from "react-icons/vsc";

const { publicRuntimeConfig } = getConfig();

function Home({ publicToken }) {
  const { devServer } = useRouter().query as Record<string, string>;

  const [hasMounted, setHasMounted] = useState(false);

  const queryClient = useQueryClient();
  useEffect(() => {
    const meta = {
      token: publicToken, //session?.userToken,
      userToken: publicToken, //session?.userToken,
      ghapi: makeGitHubAPIInstance(publicToken as string),
      octokit: makeOctokitInstance(publicToken as string),
      user: {},
      queryClient,
    };

    queryClient.setDefaultOptions({
      queries: {
        meta,
      },
    });
    setTimeout(() => {
      setHasMounted(true);
    }, 1000);
  }, []);

  const [sectionIndex, setSectionIndex] = useState(0);
  console.log(sectionIndex);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const activeSection = sections[activeSectionIndex];
  const isShowingHistory = activeSection.isShowingHistory === true;

  return (
    <AppContext.Provider
      value={{
        hasRepoInstallation: true,
        installationUrl: "",
        permissions: { admin: false, push: true, pull: false },
        devServerInfo: null,
        isPrivate: false,
        blocksConfig: {},
      }}
    >
      <div className="z-0 relative pb-6">
        <div className="pt-4 px-8 absolute top-6 z-30">
          <Link href="/">
            <a className="w-20 text-gh-marketingDark block rounded-full focus:outline-none focus:ring focus:ring-gray-400">
              <NextOctocat className="" />
            </a>
          </Link>
        </div>
        <motion.div
          className="relative z-0 w-full min-h-[min(90vh,70em)] max-h-[70em] flex flex-col items-center justify-center overflow-hidden text-gh-marketingDark text-center "
          viewport={{
            margin: "0px 50px 0px 50px",
            // amount: "all"
          }}
          onViewportEnter={(e) => {
            setSectionIndex(0);
          }}
        >
          <Hero devServer={devServer} />
        </motion.div>
        <WaveSvg />

        <motion.div
          className="mt-[-13vh] mx-auto z-10 sticky top-0 h-screen flex items-center"
          animate={{
            width: sectionIndex === 0 ? "80%" : "59%",
            left: sectionIndex === 0 ? "10%" : "37%",
          }}
        >
          {hasMounted && (
            <Frame
              sectionIndex={activeSectionIndex}
              path={activeSection.path}
              block={activeSection.block}
              isShowingHistory={isShowingHistory}
            />
          )}
        </motion.div>
        <motion.div
          viewport={{
            margin: "0px 50px 0px 50px",
            // amount: "all"
          }}
          onViewportEnter={(e) => {
            setSectionIndex(1);
          }}
        >
          <div className="p-20">
            {/* <h2 className="text-6xl font-bold mb-8">Here's your code on GitHub.com</h2> */}

            <div className="grid grid-cols-[27vw,1fr] mb-8">
              {sections.map((item, i) => (
                <BlocksIntroSection
                  key={i}
                  {...item}
                  onEnter={() => {
                    setActiveSectionIndex(i);
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
        {/* <Features /> */}
        <FooterCTA devServer={devServer} />
      </div>
    </AppContext.Provider>
  );
}
const offset = 0.2;
const numberOfWaves = 4;
const numberOfWavesSmall = 2;

export default Home;

const Hero = ({ devServer = "" }) => {
  return (
    <div className="w-full px-8 lg:px-32 flex flex-col items-center z-10 pb-6">
      <div className="flex flex-col sm:flex-row items-center mb-0">
        <h1 className="font-semibold font-mona text-[6vw] sm:text-[4vw] lg:text-[3vw] xl:text-[2vw] flex-none">
          GitHub Blocks
        </h1>
        <GradientBadge className="m-4 ml-0 sm:ml-4 flex-none">
          Technical Preview
        </GradientBadge>
      </div>
      <div className="flex">
        <h1 className="block w-auto text-[12vw] lg:text-[6vw] font-black font-mona tracking-tight leading-none">
          Bring code to life.
          <div
            style={{
              background: "linear-gradient(50deg, #79c0ff 0%, #968DF2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              WebkitBoxDecorationBreak: "clone",
              backgroundClip: "text",
            }}
          >
            Without leaving GitHub.
          </div>
        </h1>
      </div>

      <div className="mt-8 font-mona text-lg sm:text-2xl max-w-[33em] tracking-normal">
        <p>
          Easily build rich documentation, interact with content how you want,
          and tailor GitHub to fit workflow with custom, interactive blocks.
        </p>
      </div>

      <div className="mt-12 space-x-4 pointer-events-auto">
        <Link
          href={{
            pathname: "/githubnext/blocks/blob/main/README.md",
            query: devServer ? { devServer } : {},
          }}
        >
          <a className="group inline-flex items-center px-9 py-5 text-xl border border-transparent leading-4 font-bold rounded-md shadow-sm text-white bg-gradient-to-t from-black to-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#968DF2]">
            Let's get started
            <ChevronRightIcon
              size={20}
              className="inline-block ml-1 transition-transform transform group-hover:translate-x-1"
            />
          </a>
        </Link>
      </div>
    </div>
  );
};

const WaveSvg = () => (
  <svg
    aria-hidden
    className="relative block w-full h-[3vw] mt-[-3em] overflow-visible pointer-events-none z-10"
    viewBox={`0 0 ${numberOfWaves} 1`}
    preserveAspectRatio="none"
  >
    <defs>
      <linearGradient id="line-gradient">
        <stop stopColor="#ffffff00" />
        <stop stopColor="#968DF2" offset="0.5" />
        <stop stopColor="#79c0ff" offset="1" />
        <animateTransform
          attributeName="gradientTransform"
          type="translate"
          values="-0.8;0.6;-0.8"
          dur="9s"
          repeatCount="indefinite"
        />
      </linearGradient>
    </defs>
    <path
      transform="translate(0,-0.8)"
      strokeLinecap="round"
      d={`M ${numberOfWaves / 2} 0.5 ${range(numberOfWaves / 2, numberOfWaves)
        .map(
          (i) =>
            `C ${i + offset} 1 ${i + 0.5 - offset} 1 ${i + 0.5} 0.5 C ${
              i + 0.5 + offset
            } 0 ${i + 1 - offset} 0 ${i + 1} 0.5`
        )
        .join(" ")}`}
      fill="none"
      stroke="url(#line-gradient)"
      strokeWidth="1vw"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

const sections = [
  {
    title: <>Your code is already supercharged on github.com</>,
    description: <></>,
    path: "p5-sketch.js",
    block: { owner: "githubnext", repo: "blocks-examples", id: "code-block" },
    isShowingBlockPicker: false,
  },
  {
    title: <>But code is more than a collection of characters</>,
    description: (
      <>
        The important part is <em>what that code creates</em>! What if we could
        also see the output of that code?
      </>
    ),
    path: "p5-sketch.js",
    block: { owner: "githubnext", repo: "blocks-examples", id: "processing" },
  },
  {
    title: <>You're the expert of your code</>,
    description: (
      <>
        There are infinite ways to view and interact with your code, so we're
        giving you the tools to create your own, through GitHub Blocks.
      </>
    ),
    path: "p5-sketch.js",
    block: { owner: "Wattenberger", repo: "blocks", id: "p5-sandbox" },
  },
  {
    title: "Make sense of data",
    description: <>Instantly visualize any CSV file in a myriad of ways.</>,
    path: "data.csv",
    block: { owner: "githubnext", repo: "blocks-examples", id: "chart" },
  },
  {
    title: (
      <>
        Make sense of data <strong>over time</strong>
      </>
    ),
    description: (
      <>
        Switch between past versions or other branches to see how your data has
        changed.
      </>
    ),
    path: "data.csv",
    block: { owner: "githubnext", repo: "blocks-examples", id: "chart" },
    isShowingHistory: true,
  },
  {
    title: (
      <>
        Make it easier to <strong>edit your code</strong>
      </>
    ),
    description: (
      <>
        Editing raw csv files is not fun - what if you could slice, dice, and
        update your data with a spreadsheet-like interface?
        <p className="mt-3">
          Try it out! Add a new{" "}
          <code className="bg-gray-100 p-1 rounded">icon</code> type in one of
          the rows.
        </p>
      </>
    ),
    path: "data.csv",
    block: { owner: "githubnext", repo: "blocks-examples", id: "flat" },
  },
  {
    title: (
      <>
        Make it easier to <strong>edit your docs</strong>
      </>
    ),
    description: (
      <>What if creating docs was as easy as editing a markdown file?</>
    ),
    path: "README.md",
    // }, {
    //   title: "Can GitHub be a safe place for notes?",
    //   description: <></>,
    // path: "README.md",
    block: {
      owner: "githubnext",
      repo: "blocks-examples",
      id: "markdown-block",
    },
  },
  {
    title: (
      <>
        Embed <strong>live, interactive</strong> examples
      </>
    ),
    description: (
      <>
        Blocks are composable, making it easy to embed live examples that update
        with the rest of your code.
        <p className="mt-3">
          Try it out! Type{" "}
          <code className="bg-gray-200 px-2 rounded inline-block">/</code> on a
          new line.
        </p>
      </>
    ),
    path: "docs.md",
    // }, {
    //   title: "Can GitHub be a safe place for notes?",
    //   description: <></>,
    // path: "README.md",
    block: {
      owner: "githubnext",
      repo: "blocks-examples",
      id: "markdown-block",
    },
  },
  {
    title: (
      <>
        Make <strong>collaboration</strong> easier
      </>
    ),
    description: (
      <>
        Not everyone wants to see the code the same way - view CSS styles in a
        Style Guide to easily parse the styles.
      </>
    ),
    path: "style.css",
    block: { owner: "githubnext", repo: "blocks-examples", id: "css" },
  },
  {
    title: <>Make sense of folders of content</>,
    description: (
      <>
        Can we look at the contents of a folder in ways other than just a list
        of files?
      </>
    ),
    isFolder: true,
    path: "blocks-demo",
    block: { owner: "githubnext", repo: "blocks-examples", id: "minimap" },
  },
  {
    title: <>Monitor the health of your community</>,
    description: (
      <>
        Get a birds-eye view of the health of a community, and see how it's
        changed over time.
      </>
    ),
    isFolder: true,
    path: "blocks-demo",
    block: { owner: "Wattenberger", repo: "blocks", id: "communities" },
  },
  {
    title: <>Build your own custom blocks</>,
    description: (
      <>
        Blocks are open source, so you can build your own custom blocks to fit
        your needs.
        <Link href="block-docs">
          <a className="group mt-10 inline-flex items-center px-8 py-4 text-lg border border-transparent leading-4 font-bold rounded-md shadow-sm text-white bg-gradient-to-t from-black to-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#968DF2]">
            Read the docs
            <ChevronRightIcon
              size={20}
              className="inline-block ml-1 transition-transform transform group-hover:translate-x-1"
            />
          </a>
        </Link>
      </>
    ),
    path: "model.glb",
    block: { owner: "githubnext", repo: "blocks-examples", id: "3d-model" },
  },
];

const files = [...sections]
  .sort((a, b) => (a.isFolder ? -1 : 1))
  .reduce((acc, section) => {
    if (!acc.includes(section.path)) {
      acc.push(section.path);
    }
    return acc;
  }, []);
const folders = [...sections]
  .filter((section) => section.isFolder)
  .map((section) => section.path);

const BlocksIntroSection = ({
  title,
  description,
  onEnter,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  image: string;
  filename: string;
  onEnter: () => void;
}) => {
  return (
    <div className="min-h-[70vh] col-start-1">
      <motion.div
        className="p-6"
        viewport={{
          margin: "0px 50px 0px 50px",
          amount: "all",
        }}
        onViewportEnter={(e) => {
          console.log(e);
          onEnter();
        }}
      >
        <h3 className="text-3xl font-extrabold text-gh-marketingDark font-mona tracking-[-0.02em]">
          {title}
        </h3>
        <p className="text-lg mt-5 text-[#57606a] font-mona">{description}</p>
      </motion.div>
    </div>
  );
};

const FooterCTA = ({ devServer }: { devServer?: string }) => {
  return (
    <div className="relative px-10 lg:px-32 py-[30vh] bg-gh-marketingDarkBg text-white text-center z-30">
      <h2 className="text-[5vw] font-black mb-8 font-mona">
        Work with content your way
      </h2>
      {/* <p className="text-2xl mb-16 text-[#959DA5] font-mona">
        Work with any GitHub content your way.
      </p> */}
      <div className="mt-12 space-x-4">
        <Link
          href={{
            pathname: "/githubnext/blocks/blob/main/README.md",
            query: {
              ...(devServer ? { devServer } : {}),
            },
          }}
        >
          <a className="group inline-flex items-center px-9 py-5 text-xl border border-transparent leading-4 font-bold rounded-md shadow-sm text-gh-marketingButtonText bg-gradient-to-t from-gray-100 to-white hover:bg-gh-bgDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Let's get started
            <ChevronRightIcon
              size={20}
              className="inline-block ml-1 transition-transform transform group-hover:translate-x-1"
            />
          </a>
        </Link>
      </div>
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none">
        <svg
          className="absolute left-0 bottom-0 right-0 block w-full h-[3vw] z-50 overflow-visible"
          viewBox={`0 0 ${numberOfWaves} 1`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="line-gradient">
              <stop stopColor="#fff" />
              <stop stopColor="#968DF2" offset="0.5" />
              <stop stopColor="#79c0ff" offset="1" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-0.8;0.6;-0.8"
                dur="9s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          <path
            d={`M 0 1 ${range(0, numberOfWaves)
              .map(
                (i) =>
                  `C ${i + offset} 0 ${i + 0.5 - offset} 0 ${i + 0.5} 0.5 C ${
                    i + 0.5 + offset
                  } 1 ${i + 1 - offset} 1 ${i + 1} 0.5`
              )
              .join(" ")} L ${numberOfWaves} 1 Z`}
            fill="#fff"
          />
          <path
            transform="translate(0,-0.8)"
            d={`M ${numberOfWaves / 2} 0.5 ${range(
              numberOfWaves / 2,
              numberOfWaves
            )
              .map(
                (i) =>
                  `C ${i + offset} 0 ${i + 0.5 - offset} 0 ${i + 0.5} 0.5 C ${
                    i + 0.5 + offset
                  } 1 ${i + 1 - offset} 1 ${i + 1} 0.5`
              )
              .join(" ")}`}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth="1vw"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
};

const codeBlock = {
  owner: "githubnext",
  repo: "blocks-examples",
  id: "code-block",
};
const blocksPerPath = {
  "README.md": [
    codeBlock,
    { owner: "githubnext", repo: "blocks-examples", id: "markdown-block" },
  ],
  "docs.md": [
    codeBlock,
    { owner: "githubnext", repo: "blocks-examples", id: "markdown-block" },
  ],
  "p5-sketch.js": [
    codeBlock,
    { owner: "githubnext", repo: "blocks-examples", id: "processing" },
    {
      owner: "Wattenberger",
      repo: "blocks",
      id: "p5-sandbox",
    },
  ],
  "data.csv": [
    codeBlock,
    { owner: "githubnext", repo: "blocks-examples", id: "flat" },
    { owner: "githubnext", repo: "blocks-examples", id: "chart" },
  ],
  "style.css": [
    codeBlock,
    { owner: "githubnext", repo: "blocks-examples", id: "css" },
  ],
  "blocks-demo": [
    { owner: "githubnext", repo: "blocks-examples", id: "minimap" },
    { owner: "Wattenberger", repo: "blocks", id: "communities" },
  ],
  "model.glb": [
    codeBlock,
    { owner: "githubnext", repo: "blocks-examples", id: "3d-model" },
  ],
};
const defaultBlock = blocksPerPath["README.md"][0];
const examplePaths = {
  "README.md": "README.md",
  "docs.md": "examples/framer motion docs/index.md",
  "p5-sketch.js": "examples/p5-sketch.js",
  "data.csv": "examples/weather.csv",
  "style.css": "examples/styleguide.css",
  "blocks-demo": "",
  "model.glb": "examples/avocado.glb",
};
const Frame = ({
  sectionIndex = 0,
  block = defaultBlock,
  path = "README.md",
  isShowingHistory = false,
}: {
  sectionIndex: number;
  path?: string;
  block?: { owner: string; repo: string; id: string };
  isShowingHistory?: boolean;
}) => {
  const isShowingBlockPicker = sectionIndex > 0;

  const [localPath, setLocalPath] = useState(path);
  const blocks = blocksPerPath[localPath] || [defaultBlock];
  const [localBlock, setLocalBlock] = useState(blocks[0]);
  // useEffect(() => { setLocalBlock(blocks[0]) }, [localPath]);
  useEffect(() => {
    setLocalBlock(block);
  }, [block]);
  useEffect(() => {
    setLocalPath(path);
  }, [path]);

  const srcBase = publicRuntimeConfig.sandboxDomain;
  const src = `${srcBase}#${encodeURIComponent(
    JSON.stringify({
      block: localBlock,
      context: {
        owner: "githubnext",
        repo: "blocks",
        sha: "main",
        path: examplePaths[localPath],
      },
    })
  )}`;
  const [updatedContents, setUpdatedContents] = useState({});

  useBlockFrameMessages({
    owner: "githubnext",
    repo: "blocks",
    branchName: "main",
    files: [],
    updatedContents,
    setUpdatedContents,
    setRequestedMetadata: () => {},
    committedContents: {},
  });

  return (
    <div className="w-full ml-auto bg-white flex flex-col items-center justify-center mr-4">
      <motion.div
        animate={{ height: isShowingBlockPicker ? "auto" : 0 }}
        className="flex items-center"
      >
        <AnimatePresence>
          {isShowingBlockPicker && (
            <>
              <h6 className="text-gray-500 text-[0.7em] font-normal uppercase tracking-wider whitespace-nowrap">
                View {folders.includes(localPath) ? "folder" : "file"} as
              </h6>
              <div className="w-full p-2 flex space-x-2">
                <AnimatePresence>
                  {blocks
                    .slice(0, sectionIndex > 1 ? Infinity : 2)
                    .map((block) => (
                      <motion.button
                        key={block.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center text-[0.7em] py-[0.5em] px-[1.5em] border rounded-xl ${
                          block?.id === localBlock?.id
                            ? "bg-gray-100"
                            : "bg-white"
                        }`}
                        onClick={() => {
                          setLocalBlock(block);
                        }}
                      >
                        {/* <FileIcon className="w-[1em] text-gray-500" /> */}
                        <div className="ml-1">
                          {block.id[0].toUpperCase()}
                          {block.id.slice(1).replace("-block", "")}
                        </div>
                      </motion.button>
                    ))}
                </AnimatePresence>
                {sectionIndex > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-[0.7em] py-[0.5em] text-gray-500 font-normal uppercase tracking-wider"
                  >
                    + many more
                  </motion.div>
                )}
              </div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="flex flex-col w-full [aspect-ratio:16/13] border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <Box
          bg="canvas.subtle"
          borderColor="border.default"
          borderBottomWidth={1}
          borderBottomStyle="solid"
          className="py-[0.68em] px-[0.86em]"
          flex="none"
        >
          <div className="flex text-[0.7em]">
            <MarkGithubIcon />
            <span className="ml-2">githubnext</span>
            <span className="ml-1">/ blocks-demo</span>
          </div>
        </Box>
        <div
          className="flex-1 flex flex-row h-full"
          style={{
            aspectRatio: "16 / 9",
          }}
        >
          <div className="flex flex-col border-r overflow-auto w-[9em] pt-2">
            {files.map((file, i) => (
              <button
                className={`flex items-center text-[0.7em] py-[0.5em] px-[1.5em] ${
                  file === localPath ? "bg-gray-100" : "bg-white"
                }`}
                onClick={() => {
                  setLocalPath(file);
                }}
              >
                {folders.includes(file) ? (
                  <StyledOcticon
                    color="#54aeff"
                    icon={
                      file === localPath
                        ? FileDirectoryOpenFillIcon
                        : FileDirectoryFillIcon
                    }
                  />
                ) : (
                  <FileIcon className="w-[1em] ml-1 text-gray-500" />
                )}
                <div className="ml-1">{file}</div>
              </button>
            ))}
          </div>
          <div className="flex-1 h-full">
            {/* <div className="p-2 text-sm">
                  Blocks / {activeSection.filename}
                </div> */}
            {/* <div style={{
              // backgroundImage: `url(/landing/${activeSection.image})`,
              aspectRatio: "16 / 9",
            }} className="w-full bg-contain" /> */}

            <div
              className="overflow-y-auto h-[133%] w-[133%] flex-1 transform scale-75 origin-top-left"
              key={localBlock}
            >
              <iframe
                key={localPath + localBlock?.id}
                className={"w-full h-full"}
                allow="camera;microphone;xr-spatial-tracking"
                sandbox={[
                  "allow-scripts",
                  "allow-same-origin",
                  "allow-forms",
                  // so blocks can open links
                  "allow-top-navigation-by-user-activation",
                  // so blocks can open links in new windows
                  "allow-popups",
                ].join(" ")}
                src={src}
              />
            </div>
          </div>
          <motion.div animate={{ width: isShowingHistory ? "9em" : 0 }}>
            {isShowingHistory && (
              <div className="flex flex-col h-full border-l overflow-auto w-full">
                {[
                  `Update ${localPath}`,
                  `Update ${localPath}`,
                  `Update ${localPath}`,
                ].map((file, i) => (
                  <div
                    className={`flex items-center text-[0.7em] py-[0.4em] px-[1em] whitespace-nowrap truncate overflow-ellipsis w-full ${
                      i === 0 ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <div className="">{file}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const devServer = context.query.devServer as string;

  const isDev = process.env.NODE_ENV !== "production";

  const frameSrc = ["frame-src", publicRuntimeConfig.sandboxDomain, devServer]
    .filter(Boolean)
    .join(" ");

  const connectSrc = [
    "connect-src",
    "'self'",
    // for local dev
    isDev && "webpack://*",
    isDev && "ws://*",
    // for access checking
    process.env.NEXT_PUBLIC_FUNCTIONS_URL,
    // for hitting the GitHub API
    "https://api.github.com/",
    // downloading Actions Artifacts
    "https://pipelines.actions.githubusercontent.com/",
    // for Analytics
    "https://octo-metrics.azurewebsites.net/api/CaptureEvent",
    "https://eastus-8.in.applicationinsights.azure.com/",
    devServer,
  ]
    .filter(Boolean)
    .join(" ");

  context.res.setHeader(
    "Content-Security-Policy",
    [context.res.getHeader("Content-Security-Policy"), frameSrc, connectSrc]
      .filter(Boolean)
      .join(";")
  );

  return {
    props: {
      publicToken: process.env.GITHUB_PUBLIC_PAT,
    },
  };
}
