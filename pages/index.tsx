import { FullPageLoader } from "components/full-page-loader";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession({ required: false });

  if (status === "loading") {
    return <FullPageLoader />;
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full px-4 lg:px-0">
        <img className="w-24" src="/next-octocat.svg" alt="GitHub Next logo" />
        <div className="mt-4 pl-1 space-y-2">
          <h1 className="text-5xl font-bold tracking-tighter text-gray-800">
            Composable GitHub™️
          </h1>
          <p className="text-xl text-gray-500 leading-7">
            An exploration around what GitHub would look and feel like if end
            users had the ability to write and publish their own custom file
            "viewers."
          </p>
        </div>
        <div className="mt-4">
          {session ? (
            <Link href="/githubnext/composable-github-example-files?path=README.md">
              <a className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                View Sample Repository
              </a>
            </Link>
          ) : (
            <button
              // @ts-ignore
              onClick={() => signIn("github")}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
