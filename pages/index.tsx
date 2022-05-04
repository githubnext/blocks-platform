import { FullPageLoader } from "components/full-page-loader";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";

function Home() {
  const { status, data } = useSession({ required: true });

  useEffect(() => {
    if (status === "authenticated" && data.error) {
      signOut();
    }
  }, [data, status]);

  if (status === "loading") {
    return <FullPageLoader />;
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-t from-indigo-100 to-indigo-50">
      <div className="w-full px-4 lg:px-0 flex flex-col items-center justify-center z-10 pb-6">
        <h1 className="text-[10vw] font-bold tracking-tighter text-gray-800 leading-[0.8em]">
          GitHub
          <span className="font-light ml-5">Blocks</span>
        </h1>
        <div className="mt-4 text-2xl flex items-center">
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
        <div className="mt-10 space-x-4">
          <Link href="/githubnext/blocks-tutorial?path=README.md">
            <a className="inline-flex items-center px-8 py-4 text-lg border border-transparent leading-4 font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              View Sample Repository
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
