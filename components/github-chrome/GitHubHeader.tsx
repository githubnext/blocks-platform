import {
  Box, Header, StyledOcticon,
  TextInput
} from "@primer/components";
import { MarkGithubIcon } from "@primer/octicons-react";
import { Avatar } from "components/Avatar";

const links = ["Pull requests", "Issues", "Marketplace", "Explore"];
export const GitHubHeader = () => {
  return (
    <Header px={30} className="flex-none w-full">
      <Header.Item>
        <Header.Link href="#" fontSize={2}>
          <StyledOcticon icon={MarkGithubIcon} size={32} mr={2} />
        </Header.Link>
      </Header.Item>
      <Header.Item full>
        <TextInput
          width="20em"
          aria-label="searchbar"
          name="zipcode"
          placeholder="Search or jump to..."
          className="!border !border-gray-600" />
        <Box display="flex" alignItems="center" ml={2}>
          {links.map((link) => (
            <Header.Link href="#" fontSize={1} key={link} mx={2}>
              {link}
            </Header.Link>
          ))}
        </Box>
      </Header.Item>
      <Header.Item mr={0}>
        <Avatar username="mona" size="small" />
      </Header.Item>
    </Header>
  );
};
