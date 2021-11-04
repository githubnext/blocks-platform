import { Box, UnderlineNav } from "@primer/components";
import { useRouter } from "next/router";
import { useState } from "react";

const tabs = [
  ["notes"],
  ["chat"],
  ["references"]
]
export const BranchSidebar = () => {
  const [currentTab, setCurrentTab] = useState("notes");
  const router = useRouter()
  const { branch } = router.query
  return <div className="flex flex-col items-center justify-center h-full w-full slide-up">
    <UnderlineNav className="flex-none w-full">
      {tabs.map(([tab]) => {
        return (

          <UnderlineNav.Link key={tab} as="button" className="text-sm" selected={currentTab === tab} mr={0} onClick={() => {
            setCurrentTab(tab)
          }}>
            <Box px={2} fontSize={1} className="!text-gray-700">
              {tab}
            </Box>
          </UnderlineNav.Link>
        )
      })}
    </UnderlineNav>

    <Box flex="1" p={3} textAlign="left" className="w-full">
      {currentTab}
    </Box>
  </div>;
};
