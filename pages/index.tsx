import { FullPageLoader } from "components/full-page-loader";
import { hsl, range } from "d3";
import { flatten, sample, sortBy } from "lodash";
import { AnimatePresence, motion } from "framer-motion";
import type { GetServerSidePropsContext } from "next";
import getConfig from "next/config";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronRightIcon } from "@primer/octicons-react";
import { getOwnerRepoFromDevServer } from "ghapi";
import { NextOctocat } from "components/next-octocat";
import { GradientBadgeDark } from "components/gradient-badge";

const { publicRuntimeConfig } = getConfig();

function Home() {
  const { devServer } = useRouter().query as Record<string, string>;
  //const { status, data } = useSession({ required: true });

  // useEffect(() => {
  //   if (status === "authenticated" && data.error) {
  //     signOut();
  //   }
  // }, [data, status]);

  // if (status === "loading") {
  //   return <FullPageLoader />;
  // }
  const imagePositions = [
    [-48, -13],
    [-45, 4],
    [-38, 13.6],
    [36, 15],
    [46, 6],
    [51, -8],
    [20, 30],
  ];

  /*
  "block-sandbox-embed.png",
          "block-npm-info.png",
          "block-example.png",
          "block-reference.png",
          "block-sandbox.png",
          // renderers
          "block-data-1.png",
          "block-data-2.png",
          "block-annotations.png",
          "block-data-1.png",
          "block-data-2.png",
          "block-data-3.png",
          "block-drawing.png",
          "block-images.png",
          "block-mermaid.png",
          "block-minimap.png",
          "block-style.png",
          // people
          "block-community.png",
          */

  return (
    <div className="z-0 relative">
      <div className="pt-4 px-8 absolute top-6 z-30">
        <Link href="/">
          <a className="w-20 text-white block rounded-full focus:outline-none focus:ring focus:ring-gray-400">
            <NextOctocat className="" />
          </a>
        </Link>
      </div>
      <div className="relative z-30 w-full min-h-[90vh] pt-[13vh] pb-[5vh] flex flex-col items-center justify-center overflow-hidden text-white bg-gradient-to-b from-[#000] to-gh-marketingDark">
        {/* <div className="absolute inset-0 opacity-60">
          {range(0, 6).map((i) => (
            <motion.img
              key={i}
              src={`/block-demo-${i + 1}.png`}
              className="absolute top-[25vw] left-[40vw] w-80 shadow-lg rounded-3xl border"
              animate={{
                x: imagePositions[i][0] + "vw",
                y: imagePositions[i][1] + "vw",
              }}
            />
          ))}
        </div> */}
        <div className="w-full px-8 lg:px-32 flex flex-col z-10 pb-6 text-white">
          <div className="flex items-center mb-8">
            <h1 className="font-semibold font-mona text-[6vw] sm:text-[4vw] lg:text-[3vw] xl:text-[2vw] flex-none">
              GitHub Blocks
            </h1>
            <GradientBadgeDark className="ml-4 flex-none">
              Technical Preview
            </GradientBadgeDark>
          </div>
          <h1
            className="text-[12vw] lg:text-[9vw] font-black font-mona tracking-tight leading-none -ml-1"
            style={{
              background: "linear-gradient(60deg, #fff 40%, #B88AE1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              WebkitBoxDecorationBreak: "clone",
              backgroundClip: "text",
            }}
          >
            Reimagine
            <br />
            repositories
          </h1>

          <div className="mt-8 font-mona text-lg sm:text-2xl tracking-normal text-[#959DA5]">
            <p className="mb-2">
              Extend your codebase with custom, interactive blocks.
            </p>
            <p>
              Build rich documentation, enhance your workflows, and bring your
              repository to life.
            </p>
          </div>

          <div className="mt-12 space-x-4 pointer-events-auto">
            <Link
              href={{
                pathname: "/githubnext/blocks-tutorial",
                query: {
                  path: "README.md",
                  ...(devServer ? { devServer } : {}),
                },
              }}
            >
              <a className="group inline-flex items-center px-8 py-4 text-lg border border-transparent leading-4 font-medium rounded-md shadow-sm text-gh-text bg-gh-bg hover:bg-gh-bgDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Let's get started
                <ChevronRightIcon
                  size={20}
                  className="inline-block ml-1 transition-transform transform group-hover:translate-x-1"
                />
              </a>
            </Link>
          </div>
        </div>
      </div>
      <svg
        className="relative block w-full h-[5em] z-50 overflow-visible"
        viewBox={`0 0 ${numberOfWaves} 1`}
        preserveAspectRatio="none"
      >
        <path
          d={`M 0 0 ${range(0, numberOfWaves)
            .map(
              (i) =>
                `C ${i + offset} 1 ${i + 0.5 - offset} 1 ${i + 0.5} 0.5 C ${
                  i + 0.5 + offset
                } 0 ${i + 1 - offset} 0 ${i + 1} 0.5`
            )
            .join(" ")} L ${numberOfWaves} 0 Z`}
          fill="#050D21"
        />
        <path
          transform="translate(0,-0.5)"
          d={`M ${startWaveLine} 0.5 ${range(startWaveLine, numberOfWaves)
            .map(
              (i) =>
                `C ${i + offset} 1 ${i + 0.5 - offset} 1 ${i + 0.5} 0.5 C ${
                  i + 0.5 + offset
                } 0 ${i + 1 - offset} 0 ${i + 1} 0.5`
            )
            .join(" ")}`}
          fill="none"
          stroke="#fff"
          strokeWidth={10}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Features />
      <FooterCTA devServer={devServer} />
    </div>
  );
}
const offset = 0.2;
const numberOfWaves = 4;
const startWaveLine = 2;

export default Home;

const scrollcontent = [
  {
    title: "Stronger documentation without the sweat",
    subtitle:
      "READMEs don’t have to be static. Create rich, interactive repositories that showcase your project.",
    sections: [
      {
        text: "Embed a live demo block instead of a screenshot",
        image: "block-sandbox.png",
      },
      {
        text: "Show off live stats about the health of your project",
        image: "block-npm-info.png",
      },
      {
        text: "Create searchable reference documentation",
        image: "block-reference.png",
      },
      {
        text: "Turn your repository structure into your table of contents",
        image: "blocks-nav.png",
      },
    ],
  },
  {
    title: "View and interact with your content however you want",
    subtitle:
      "Just because the files are textual, doesn't mean you have to see them as text.",
    sections: [
      {
        text: "Not all files are easy to understand in their raw form, like CSV or JSON data",
        image: "block-data-3.png",
      },
      {
        text: "Pick a different block to see and interact with your data, like a spreadsheet…",
        image: "block-data-1.png",
      },
      {
        text: "… or custom visualizations",
        image: "block-data-2.png",
      },
      {
        text: "Create and edit diagrams that can be embedded into your documentation",
        image: "block-drawing.png",
      },
      {
        text: "Build tailored interfaces for your workflows",
        image: "block-style.png",
      },
    ],
  },
  {
    title: "See the big picture",
    subtitle: "Blocks work for files, folders, and entire repositories",
    sections: [
      {
        text: "Understand the health of your community and the people who are part of it",
        image: "block-community.png",
      },
      {
        text: "Understand the structure of your code at a glance",
        image: "block-minimap.png",
      },
    ],
  },
];
const Features = () => {
  const [imageIndex, setImageIndex] = useState(0);

  return (
    <div className="z-10 relative grid grid-cols-[1fr,2fr] px-10">
      <div className="">
        <div className="h-screen w-full flex flex-col justify-center">
          <h3 className="text-6xl font-bold mt-16 mb-8">
            What if repositories could do more?
          </h3>
        </div>
        {scrollcontent.map((item, i) => (
          <div className="" key={i}>
            <div className="sticky top-0">
              <div className="h-screen sticky top-0 w-full flex flex-col justify-start">
                <h3 className="text-6xl font-bold mt-20 mb-8">{item.title}</h3>
                <p className="text-2xl mb-16">{item.subtitle}</p>
              </div>
            </div>
            {item.sections.map((section, j) => (
              <div
                className="h-screen sticky top-0 w-full flex flex-col justify-end pb-44"
                key={j}
              >
                <div className="bg-white py-10">
                  <p className="text-2xl mb-16 font-bold">{section.text}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="px-10">
        <div className="h-screen" />
        {scrollcontent.map((item) => (
          <Fragment key={item.title}>
            <div className="h-screen bg-white w-full sticky top-0" />
            {item.sections.map(({ image }, j) => (
              <div
                className="sticky top-0 w-full h-screen flex items-center justify-center"
                key={j}
              >
                <img
                  src={`/landing/${image}`}
                  className="block w-[98%] mx-auto rounded-xl"
                />
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

const GradientBackground = () => {
  const colors = [
    "#db469f",
    "#2188ff",
    "#f6c343",
    "#f6c343",
    "#2188ff",
    "#db469f",
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-30"
      viewBox="0 0 10 10"
    >
      <defs>
        <filter id="blur" x="-100%" y="-100%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
        </filter>
        <filter id="multiply" x="-50%" y="-50%" width="200%" height="200%">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
          />
        </filter>
      </defs>
      {colors.map((color, i) => (
        <g filter="url(#blur)" key={i}>
          <circle
            key={i}
            cx={i * 2}
            cy={-Math.sin(i) + 5}
            r={2}
            fill={color}
            filter="url(#multiply)"
            className="mix-blend-multiply"
          />
        </g>
      ))}
    </svg>
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
    // for hitting the GitHub API
    "https://api.github.com/",
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

  return { props: {} };
}

const BuildABlock = () => {
  return (
    <div className="p-32 bg-gh-marketingDark text-white mx-20 rounded-xl">
      <h2 className="text-6xl font-bold mb-8">Build custom blocks</h2>
      <p className="text-2xl mb-16">
        Extend your codebase with custom, interactive blocks.
      </p>
    </div>
  );
};
const FooterCTA = ({ devServer }: { devServer?: string }) => {
  return (
    <div className="p-32 mx-20 mb-20 bg-gh-marketingDark text-white">
      <h2 className="text-6xl font-bold mb-8">Get started</h2>
      <p className="text-2xl mb-16">
        Extend your codebase with custom, interactive blocks.
      </p>
      <div className="mt-12 space-x-4 pointer-events-auto">
        <Link
          href={{
            pathname: "/githubnext/blocks-tutorial",
            query: {
              path: "README.md",
              ...(devServer ? { devServer } : {}),
            },
          }}
        >
          <a className="group inline-flex items-center px-8 py-4 text-lg border border-transparent leading-4 font-medium rounded-md shadow-sm text-gh-text bg-gh-bg hover:bg-gh-bgDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
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
