import { Header } from "@primer/components";
import { NextOctocat } from "./next-octocat";

export const GitHubHeader = () => {
  return (
    <Header px={30} className="flex-none">
      <Header.Item>
        <Header.Link href="#" fontSize={2}>
          <span className="w-8 inline-flex items-center text-white">
            <NextOctocat />
          </span>
        </Header.Link>
      </Header.Item>

      <Header.Item full>
        This is a prototype. More information about this project{" "}
        <a href="" className="underline ml-1">
          {" "}
          can be found here
        </a>
      </Header.Item>
    </Header>
  );
};
