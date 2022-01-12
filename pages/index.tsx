import { withPasswordProtect } from "@storyofams/next-password-protect";
import { AnimatedBlocks } from "components/AnimatedBlocks";
import { FullPageLoader } from "components/full-page-loader";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

function Home() {
  const { data: session, status } = useSession({ required: false });

  if (status === "loading") {
    return <FullPageLoader />;
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-t from-indigo-100 to-indigo-50">
      <div className="w-full px-4 lg:px-0 flex flex-col items-center justify-center z-10">
        <h1 className="text-[10vw] font-bold tracking-tighter text-gray-800 leading-[0.8em]">
          GitHub
          <span className="font-light ml-5">
            Blocks
          </span>
        </h1>
        <p className="text-2xl tracking-[0.01em] font-light text-gray-500 leading-8 mt-7 max-w-2xl text-center mx-auto">
          What GitHub would look and feel like if end
          users could control how they interact with their content?
        </p>
        <div className="mt-10 space-x-4">
          {!session && (
            <button
              // @ts-ignore
              onClick={() => signIn("github")}
              className="inline-flex items-center px-8 py-4 text-lg border border-transparent leading-4 font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in with GitHub
            </button>
          )}
          <Link href="/githubnext/blocks-tutorial?path=README.md">
            <a className="inline-flex items-center px-8 py-4 text-lg border border-transparent leading-4 font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              View Sample Repository
            </a>
          </Link>
        </div>
        <div className="mt-6 text-2xl flex items-center">
          <div className="font-light text-xl">
            an exploration by
          </div>
          <img className="w-[1.5em] ml-2" src="/next-octocat.svg" alt="GitHub Next logo" />
          <div className="font-bold tracking-tight">
            GitHub
            <span className="font-normal ml-1">
              Next
            </span>
          </div>

        </div>
      </div>
      <div className="absolute inset-0 z-0">
        <AnimatedBlocks />
      </div>
    </div>
  );
}

export default process.env.PASSWORD_PROTECT
  ? withPasswordProtect(Home)
  : Home