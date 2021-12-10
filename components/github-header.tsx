import Link from "next/link";
import { NextOctocat } from "./next-octocat";
import SearchDropdown from "./search-dropdown";

interface GitHubHeaderProps {
  token: string
}

export const GitHubHeader = (props: GitHubHeaderProps) => {
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
        <div className="flex-1">
          <SearchDropdown token={props.token} />
        </div>
      </div>
      <p className="text-sm opacity-50 mt-2 lg:mt-0 lg:ml-4">
        GitHub Blocks is an exploratory prototype. More information about this
        project{" "}
        <a href="" className="underline ml-1">
          {" "}
          can be found here
        </a>
      </p>
    </header>
  );
};
