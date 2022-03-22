import Link from "next/link";
import { NextOctocat } from "./next-octocat";
import { RepoSearch } from "./repo-search";

export const GitHubHeader = () => {
  return (
    <header className="bg-gray-900 text-white px-[30px] py-4 lg:flex items-center">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <Link href="/">
            <a className="w-8 inline-flex items-center text-white">
              <NextOctocat />
            </a>
          </Link>
        </div>
        <div className="flex-1 min-w-[240px]">
          <RepoSearch />
        </div>
      </div>
      <p className="text-sm opacity-50 mt-2 lg:mt-0 lg:ml-4">
        GitHub Blocks is an exploratory prototype. More information about this
        project{" "}
        <a
          href="https://thehub.github.com/news/2022-03-08-blocks-githubnext-announcement"
          className="underline ml-1"
          target="_blank"
          rel="noreferrer"
        >
          {" "}
          can be found here
        </a>
      </p>
    </header>
  );
};
