import { FullPageLoader } from "components/full-page-loader";
import { hsl, range } from "d3";
import { flatten, sample, sortBy } from "lodash";
import { AnimatePresence, motion } from "framer-motion";
import type { GetServerSidePropsContext } from "next";
import getConfig from "next/config";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRightIcon } from "@primer/octicons-react";
import { useSignOutOnSessionError } from "hooks";

const { publicRuntimeConfig } = getConfig();

function Home() {
  const { devServer } = useRouter().query as Record<string, string>;
  const { status, data } = useSession({ required: true });
  const [isLeaving, setIsLeaving] = useState(false);

  useSignOutOnSessionError(status, data);

  if (status === "loading") {
    return <FullPageLoader />;
  }

  return (
    <div className="relative h-screen overflow-hidden flex items-center justify-center">
      <div className="w-full px-4 lg:px-0 flex flex-col items-center justify-center z-10 pb-6 pointer-events-none">
        <h1 className="text-[10vw] font-bold tracking-tighter text-gray-800 leading-[0.8em]">
          GitHub
          <span className="font-light ml-5">Blocks</span>
        </h1>
        <div className="mt-4 text-2xl flex items-center bg-white px-10">
          <div className="font-light text-xl">an exploration by</div>
          <img
            className="w-[1.5em] ml-2"
            src="/next-octocat.svg"
            alt="GitHub Next logo"
          />
          <div className="font-bold tracking-tight">
            GitHub
            <span className="font-normal ml-1">Next</span>
          </div>
        </div>
        <div className="mt-10 space-x-4 pointer-events-auto">
          <Link
            href={{
              pathname: "/githubnext/blocks-tutorial",
              query: { path: "README.md", ...(devServer ? { devServer } : {}) },
            }}
          >
            <a
              className="inline-flex items-center px-8 py-4 text-lg border border-transparent leading-4 font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setIsLeaving(true)}
            >
              View Sample Repository
              <span className="inline-block ml-1">
                <ChevronRightIcon size={20} />
              </span>
            </a>
          </Link>
        </div>
      </div>
      <Background isLeaving={isLeaving} />
    </div>
  );
}

export default Home;

const colors = [
  // "#fffedd", "#ddf4ff", "#fbefff", "#FFF0EB", "#fff", "#fff", "#fff"
  "#fff8c5",
  "#b6e3ff",
  "#ecd8ff",
  "#FFC2B2",
  "#fff",
  "#fff",
  "#fff",
];
const shapePaths = {
  circle: "M 0 -0.5 a 0.5 0.5 0 0 1 0 1 a 0.5 0.5 0 0 1 0 -1 z",
  flower:
    "M 0 -0.5 a 0.5 0.5 0 0 0 0.5 0.5 a 0.5 0.5 0 0 0 -0.5 0.5 a 0.5 0.5 0 0 0 -0.5 -0.5 a 0.5 0.5 0 0 0 0.5 -0.5 z",
  flower2:
    "M -0.5 -0.5 a 0.5 0.5 0 0 1 0.5 0.5 a 0.5 0.5 0 0 1 0.5 -0.5 a 0.5 0.5 0 0 1 -0.5 0.5 a 0.5 0.5 0 0 1 0.5 0.5 a 0.5 0.5 0 0 1 -0.5 -0.5 a 0.5 0.5 0 0 1 -0.5 0.5 a 0.5 0.5 0 0 1 0.5 -0.5 a 0.5 0.5 0 0 1 -0.5 -0.5 z",
  square: "M -0.5 -0.5 h 1 v 1 h -1 z",
  triangle: "M -0.5 0.5 l 0.5 -1 l 0.5 1 z",
  bridge: "M -0.5 -0.5 h 2 v 1 h -0.5 a 0.5 0.5 0 0 0 -1 0 h -0.5 z",
  none: "",
};
const shapes = Object.keys(shapePaths);
const offsetColor = (color: string) => {
  const hslColor = hsl(color);
  hslColor.l += 0.06;
  hslColor.s += 0.5;
  hslColor.h += 22;
  return hslColor.toString();
};

const Background = ({ isLeaving }) => {
  const [rows, setRows] = useState([]);

  useMemo(() => {
    const newRows = flatten(
      range(0, 10).map((i) => {
        return range(0, 10).map((j) => {
          let shape = sample(shapes);
          return {
            shape,
            x: j,
            y: i,
            color: sample(colors),
          };
        });
      })
    );
    setRows(newRows);
  }, []);
  let sortedRows = sortBy(rows, (d, i) => {
    return d.shape === "bridge" ? i - 1000 : i;
  });

  return (
    <svg
      className="absolute inset-0 flex flex-col items-center justify-center"
      viewBox="0 0 10 10"
      preserveAspectRatio="none"
    >
      <defs>
        {colors.map((color, i) => (
          <linearGradient
            key={i}
            id={`gradient-${color}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={offsetColor(color)} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        ))}
      </defs>
      <AnimatePresence>
        {sortedRows.map(
          ({ shape, color, x, y }, i) =>
            !isLeaving && (
              <motion.g
                initial={{ x: x + 0.5, y: 0 + 0.5, opacity: 0, rotate: -45 }}
                animate={{ x: x + 0.5, y: y + 0.5, opacity: 1, rotate: 0 }}
                exit={{ x: x + 0.5, y: 5, opacity: 0, rotate: 45 }}
                transition={{ delay: y * 0.1 + x * 0.2 }}
                key={`${y}-${x}`}
              >
                {shape === "bridge" && (
                  <rect x="-0.5" y="-0.5" width="2" height="1" fill="#fff" />
                )}
                <AnimatePresence>
                  <motion.path
                    key={shape}
                    d={shapePaths[shape]}
                    // fill={color}
                    fill={`url(#gradient-${color})`}
                    stroke="#E0E4E5"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    initial={{ scale: 0 }}
                    animate={{ scale: 0.9 }}
                    exit={{ scale: 0 }}
                  />
                </AnimatePresence>
                <rect
                  width="1"
                  height="1"
                  fill="transparent"
                  x="-0.5"
                  y="-0.5"
                  onMouseEnter={() => {
                    const newRows = [...sortedRows].map((d) => ({ ...d }));
                    newRows[i].color = sample(colors);
                    newRows[i].shape = sample(shapes);
                    setRows(newRows);
                  }}
                />
              </motion.g>
            )
        )}
      </AnimatePresence>
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
