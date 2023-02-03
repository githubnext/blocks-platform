import {
  ChevronRightIcon,
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  FileIcon,
  LogoGithubIcon,
  MarkGithubIcon,
  PlugIcon,
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
import { VscFolder, VscReactions } from "react-icons/vsc";

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
          className={`mt-[-13vh] z-10 sticky top-0 h-screen flex items-center`}
          animate={{
            width:
              sectionIndex === 0
                ? "80%"
                : activeSection.hasAlternateLayout
                ? "66%"
                : "59%",
            // opacity: activeSection.hasAlternateLayout ? 0 : 1,
            left:
              sectionIndex === 0
                ? "10%"
                : activeSection.hasAlternateLayout
                ? "0%"
                : "37%",
            x: activeSection.hasAlternateLayout ? "-6%" : 0,
          }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 100,
          }}
        >
          {hasMounted && (
            <Frame
              sectionIndex={activeSectionIndex}
              path={activeSection.path}
              block={activeSection.block}
              isShowingHistory={isShowingHistory}
              isEditing={!!activeSection.isEditing}
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

            <div className="mb-2">
              {sections.map(
                (item, i) =>
                  hasMounted && (
                    <BlocksIntroSection
                      key={i}
                      {...item}
                      onEnter={() => {
                        setActiveSectionIndex(i);
                      }}
                    />
                  )
              )}
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
    description: (
      <>
        No dashboards needed - instantly turn live data into any chart,
        shareable with a url.
      </>
    ),
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
          ✨ Try it out! Add a new{" "}
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
      <>
        What if creating documentation for your library was as easy as editing a
        markdown file?
      </>
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
        with the rest of your code. Let your users try out any version of your
        library, where your code lives.
        <p className="mt-3">
          ✨ Try it out! Type{" "}
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
        Not everyone wants to see the code the same way - designers can view CSS
        styles in a Style Guide, instead of reading the code.
      </>
    ),
    path: "style.css",
    block: { owner: "githubnext", repo: "blocks-examples", id: "css" },
  },
  {
    title: <>Make sense of folders of content</>,
    description: (
      <>
        In addition to file blocks, we have <strong>folder blocks</strong>. Use
        these to view the structure of your codebase.
      </>
    ),
    isFolder: true,
    path: "blocks-demo",
    block: { owner: "githubnext", repo: "blocks-examples", id: "minimap" },
  },
  {
    title: <>Search and filter images</>,
    description: (
      <>
        Folder blocks can also be used to explore the folders' contents: for
        example, search and filter all of the icons in your codebase at once.
      </>
    ),
    isFolder: true,
    path: "blocks-demo",
    block: { owner: "Wattenberger", repo: "blocks", id: "images" },
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
    title: <>Build your own blocks</>,
    hasAlternateLayout: true,
    isEditing: true,
    description: (
      <>
        We know you have a unique workflow, so we've made it easy for you to
        build your own blocks.
        <p className="mt-4">
          We've made it as easy as possible, with a simple API and quick-start
          templates in any framework you like best:
        </p>
        <div className="mt-6 grid grid-cols-4 gap-5">
          <a
            href="https://github.com/githubnext/blocks-template-react/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center"
          >
            <svg className="w-full" viewBox="-11.5 -10.23174 23 20.46348">
              <title>React Logo</title>
              <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
              <g stroke="#61dafb" stroke-width="1" fill="none">
                <ellipse rx="11" ry="4.2" />
                <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                <ellipse rx="11" ry="4.2" transform="rotate(120)" />
              </g>
            </svg>
          </a>
          <a
            href="https://github.com/githubnext/blocks-template-svelte/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center"
          >
            <svg className="w-[90%]" viewBox="0 0 100 112">
              <path
                fill="#ff3e00"
                d="M87.269,14.819C76.869-.066,56.328-4.478,41.477,4.984L15.4,21.608A29.921,29.921,0,0,0,1.876,41.651,31.514,31.514,0,0,0,4.984,61.882,30.006,30.006,0,0,0,.507,73.065,31.892,31.892,0,0,0,5.955,97.181c10.4,14.887,30.942,19.3,45.791,9.835L77.829,90.392A29.915,29.915,0,0,0,91.347,70.349a31.522,31.522,0,0,0-3.1-20.232,30.019,30.019,0,0,0,4.474-11.182,31.878,31.878,0,0,0-5.447-24.116"
              />
              <path
                fill="white"
                d="M38.929,98.582a20.72,20.72,0,0,1-22.237-8.243,19.176,19.176,0,0,1-3.276-14.5,18.143,18.143,0,0,1,.623-2.435l.491-1.5,1.337.981a33.633,33.633,0,0,0,10.2,5.1l.969.294-.089.968A5.844,5.844,0,0,0,28,83.122a6.24,6.24,0,0,0,6.7,2.485,5.748,5.748,0,0,0,1.6-.7L62.382,68.281a5.43,5.43,0,0,0,2.451-3.631,5.794,5.794,0,0,0-.988-4.371,6.244,6.244,0,0,0-6.7-2.487,5.755,5.755,0,0,0-1.6.7l-9.953,6.345a19.06,19.06,0,0,1-5.3,2.326,20.719,20.719,0,0,1-22.237-8.243,19.171,19.171,0,0,1-3.277-14.5A17.992,17.992,0,0,1,22.915,32.37L49,15.747a19.03,19.03,0,0,1,5.3-2.329,20.72,20.72,0,0,1,22.237,8.243,19.176,19.176,0,0,1,3.277,14.5,18.453,18.453,0,0,1-.624,2.435l-.491,1.5-1.336-.979a33.616,33.616,0,0,0-10.2-5.1l-.97-.294.09-.968a5.859,5.859,0,0,0-1.052-3.878,6.241,6.241,0,0,0-6.7-2.485,5.748,5.748,0,0,0-1.6.7L30.842,43.719a5.421,5.421,0,0,0-2.449,3.63,5.79,5.79,0,0,0,.986,4.372,6.245,6.245,0,0,0,6.7,2.487,5.773,5.773,0,0,0,1.6-.7l9.952-6.342a18.978,18.978,0,0,1,5.3-2.328,20.718,20.718,0,0,1,22.236,8.243,19.171,19.171,0,0,1,3.277,14.5,18,18,0,0,1-8.13,12.054L44.229,96.253a19.017,19.017,0,0,1-5.3,2.329"
              />
            </svg>
          </a>
          <a
            href="https://github.com/githubnext/blocks-template-vue/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center"
          >
            <svg viewBox="0 0 128 128" className="w-full">
              <path
                fill="#42b883"
                d="M78.8,10L64,35.4L49.2,10H0l64,110l64-110C128,10,78.8,10,78.8,10z"
              ></path>
              <path
                fill="#35495e"
                d="M78.8,10L64,35.4L49.2,10H25.6L64,76l38.4-66H78.8z"
              ></path>
            </svg>
          </a>

          <div className="border rounded-xl border-dashed text-slate-500 text-xs flex items-center justify-center text-center tracking-wide p-3">
            or make your own template
          </div>
        </div>
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
    block: {
      owner: "githubnext",
      repo: "blocks-examples",
      id: "my custom block",
    },
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
  hasAlternateLayout = false,
  onEnter,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  filename: string;
  hasAlternateLayout: boolean;
  onEnter: () => void;
}) => {
  return (
    <div
      className={`min-h-[90vh] w-[27em] ${
        hasAlternateLayout ? "ml-auto text-right" : ""
      }`}
    >
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
    <div className="relative px-10 lg:px-32 py-[33vh] bg-gh-marketingDarkBg text-white text-center z-30">
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
    { owner: "Wattenberger", repo: "blocks", id: "images" },
    { owner: "Wattenberger", repo: "blocks", id: "communities" },
  ],
  "model.glb": [
    { owner: "githubnext", repo: "blocks-examples", id: "my custom block" },
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
  isEditing = false,
}: {
  sectionIndex: number;
  path?: string;
  block?: { owner: string; repo: string; id: string };
  isShowingHistory?: boolean;
  isEditing?: boolean;
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
  const [headlineText, setHeadlineText] = useState("Hello from your block");

  const srcBase = publicRuntimeConfig.sandboxDomain;
  const src = `${srcBase}#${encodeURIComponent(
    JSON.stringify({
      block: localBlock,
      context: {
        owner: block.id === "images" ? "feathericons" : "githubnext",
        repo: block.id === "images" ? "feather" : "blocks",
        sha: block.id === "images" ? "master" : "main",
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
                {sectionIndex > 1 && !isEditing && (
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
      <div className="flex flex-col w-full [aspect-ratio:16/10.5] border border-gray-200 rounded-xl shadow-lg">
        <Box
          bg="canvas.subtle"
          borderColor="border.default"
          borderBottomWidth={1}
          borderBottomStyle="solid"
          className="py-[0.68em] px-[0.86em] rounded-t-xl"
          flex="none"
        >
          <div className="flex text-[0.7em]">
            <MarkGithubIcon />
            <span className="ml-2">githubnext</span>
            <span className="ml-1">/ blocks-demo</span>
          </div>
        </Box>
        <div className="flex-1 flex flex-row h-full">
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
          {isEditing ? (
            <motion.div
              className="relative flex-1 h-full overflow-hidden border-4 border-indigo-500 shadow-inner shadow-indigo-100"
              initial={{ borderWidth: 0 }}
              animate={{ borderWidth: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="absolute top-2 right-4 text-indigo-500"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
              >
                <PlugIcon />
              </motion.div>
              <div className="p-[2em]">
                <h1 className="mt-[0.6em] text-[2em] font-bold">
                  {headlineText}
                </h1>
                <pre className="mt-[2em] overflow-hidden  w-full bg-slate-50 text-slate-500 border border-slate-100 p-[1em] text-[0.8em]">{`{
  "name": "blocks-template-react",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@githubnext/blocks": "^2.3.4",
    "@githubnext/blocks-runtime": "^1.0.3",
    "@types/react": "^18.0.26"
  }
}`}</pre>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 h-full">
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
          )}
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
          <motion.div
            animate={{ width: isEditing ? "26em" : 0 }}
            transition={{ delay: isEditing ? 1.3 : 0, duration: 0.2 }}
            className="flex-none h-full min-w-0"
          >
            {isEditing && (
              <motion.div
                className="h-full w-[26em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                <div className="p-5 whitespace-pre-wrap font-mono text-[0.7em] leading-relaxed">
                  <span className="text-[#cf222e]">import</span>
                  {` { FileBlockProps } `}
                  <span className="text-[#cf222e]">from</span>
                  <span className="text-[#0a3069]">
                    <motion.span
                      initial={{
                        border: "1px solid transparent",
                        background: "#ffffff00",
                      }}
                      animate={{
                        border: "1px solid #A5B4FB",
                        background: "#EDF3FA",
                      }}
                      transition={{ delay: 1.8 }}
                      className="relative p-1 border border-indigo-300"
                    >
                      {`"@githubnext/blocks"`}
                      <motion.div
                        initial={{ opacity: 0, x: "50%", y: 20 }}
                        animate={{ opacity: 1, x: "50%", y: 0 }}
                        transition={{ delay: 1.8 }}
                        className="absolute top-0 right-0 text-[1.2em] transform mr-[-3em] -translate-y-full font-mona tracking-wide font-medium w-[12em] mt-[-2.8em] text-indigo-500"
                      >
                        Block-building utilities
                        <svg
                          className="absolute left-[-2.3em] top-[0.8em] w-[2em] h-[2em] overflow-visible transform rotate-90"
                          viewBox="0 0 1 1"
                        >
                          <path
                            d="M 0 0 C 0 1 1 1 1 1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </motion.div>
                    </motion.span>
                  </span>
                  ;<br />
                  <span className="text-[#cf222e]">import </span>
                  <span className="text-[#0a3069]">"./index.css"</span>;
                  <br />
                  <br />
                  <span className="text-[#cf222e]">{`export default function `}</span>
                  {`(props:`}
                  <motion.span
                    initial={{
                      border: "1px solid transparent",
                      background: "#ffffff00",
                    }}
                    animate={{
                      border: "1px solid #A5B4FB",
                      background: "#EDF3FA",
                    }}
                    transition={{ delay: 2 }}
                    className="relative p-1 border border-indigo-300"
                  >
                    FileBlockProps
                    <motion.div
                      initial={{ opacity: 0, x: "100%", y: 20 }}
                      animate={{ opacity: 1, x: "100%", y: 0 }}
                      transition={{ delay: 2 }}
                      className="absolute top-0 right-0 text-[1.2em] transform translate-x-full translate-y-full font-mona tracking-wide font-medium w-[10em] mt-[2.9em] text-indigo-500 h-[1.5em] leading-tight"
                    >
                      Typed data & callback functions
                      <svg
                        className="absolute left-[-2.3em] top-[-1.3em] w-[2em] h-[2em] overflow-visible"
                        viewBox="0 0 1 1"
                      >
                        <path
                          d="M 0 0 C 0 1 1 1 1 1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </motion.div>
                  </motion.span>
                  {`) {`}
                  <span className="inline-block text-[#cf222e]">{`  const`}</span>
                  {` { content } = props;`}
                  <br />
                  <span className="text-[#cf222e]">{`
  return `}</span>
                  (
                  <span className="text-[#0a3069]">{`
    <>`}</span>
                  <br />
                  <span className="text-[#0a3069]">{`      <`}</span>
                  <span className="text-[#116329]">h1</span>
                  <span className="text-[#0a3069]">{`>`}</span>
                  <input
                    className="bg-transparent border-none outline-none"
                    style={{ width: headlineText.length + 0.2 + "ch" }}
                    value={headlineText}
                    onChange={(e) => setHeadlineText(e.target.value)}
                    autoFocus
                  />
                  <span className="text-[#0a3069]">{`</`}</span>
                  <span className="text-[#116329]">h1</span>
                  <span className="text-[#0a3069]">{`>`}</span>
                  <span className="text-[#0a3069]">{`
      <`}</span>
                  <span className="text-[#116329]">pre</span>
                  <span className="text-[#0a3069]">{`>`}</span>
                  <motion.span
                    initial={{
                      border: "1px solid transparent",
                      background: "#ffffff00",
                    }}
                    animate={{
                      border: "1px solid #A5B4FB",
                      background: "#EDF3FA",
                    }}
                    transition={{ delay: 2.2 }}
                    className="relative p-1 border border-indigo-300"
                  >
                    {`{content}`}
                    <motion.div
                      initial={{
                        opacity: 0,
                        x: "100%",
                        y: 20,
                      }}
                      animate={{ opacity: 1, x: "100%", y: 0 }}
                      transition={{ delay: 2.2 }}
                      className="absolute top-0 right-0 text-[1.2em] transform translate-x-full font-mona tracking-wide font-medium w-[9em] mt-[2.9em] text-indigo-500 h-[1.5em] leading-tight"
                    >
                      Useful data,
                      <br />
                      like the contents of the file
                      <svg
                        className="absolute left-[-2.3em] top-[-1.3em] w-[2em] h-[2em] overflow-visible"
                        viewBox="0 0 1 1"
                      >
                        <path
                          d="M 0 0 C 0 1 1 1 1 1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </motion.div>
                  </motion.span>
                  <span className="text-[#0a3069]">{`</`}</span>
                  <span className="text-[#116329]">pre</span>
                  <span className="text-[#0a3069]">{`>`}</span>
                  <span className="text-[#0a3069]">{`
    </>`}</span>
                  {`
  );
}`}
                </div>
              </motion.div>
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
