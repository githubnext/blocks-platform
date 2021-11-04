import { Box, Link, StyledOcticon } from "@primer/components";
import { MarkGithubIcon } from "@primer/octicons-react";

const footerLinks = [
  [
    "Terms",
    "https://docs.github.com/en/github/site-policy/github-terms-of-service",
  ],
  [
    "Privacy",
    "https://docs.github.com/en/github/site-policy/github-privacy-statement",
  ],
  ["Security", "https://github.com/security"],
  ["Status", "https://www.githubstatus.com/"],
  ["Docs", "https://docs.github.com"],
  ["Contact GitHub", "https://support.github.com?tags=dotcom-footer"],
  ["Pricing", "https://github.com/pricing"],
  ["API", "https://docs.github.com"],
  ["Training", "https://services.github.com"],
  ["Blog", "https://github.blog"],
  ["About", "https://github.com/about"],
];
export const Footer = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      pt={18}
      pb={20}
      borderTopWidth={1}
      borderTopStyle="solid"
      borderTopColor="border.default"
      className="flex-none max-w-[1250px] mx-10 self-center"
      style={{
        width: "calc(100% - 5em)",
      }}
    >
      <Box display="flex" alignItems="center" mr={2} className="text-gray-500">
        <StyledOcticon icon={MarkGithubIcon} size={25} mr={2} />
        <div className="text-xs">© 2021 GitHub, Inc.</div>
      </Box>
      <Box
        display="flex"
        alignItems="center"
        flex="1"
        justifyContent="space-evenly"
        className="max-w-[70em]"
      >
        {footerLinks.map(([label, href]) => (
          <Box key={label} display="flex" alignItems="center" mx={2}>
            <Link href={href} className="text-xs">
              {label}
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
