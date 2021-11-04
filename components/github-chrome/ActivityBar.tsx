import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Button, UnderlineNav
} from "@primer/components";
import { useRouter } from "next/router";
import { useState } from "react";
import { ArrowRightIcon, PlusIcon, XIcon } from "@primer/octicons-react";
import { ActivityFeed } from "components/ActivityFeed";

export const activityTabs = ["Activity", "Branches"]

export const ActivityBar = ({ isEditing, isLoadingRepoInfo, activity, branches }: {
  isEditing: boolean;
  isLoadingRepoInfo: boolean;
  activity: any;
  branches: any[];
}) => {
  const [currentTab, setCurrentTab] = useState("Activity");
  const router = useRouter();

  const [newBranchName, setNewBranchName] = useState("");
  const [isCreatingNewBranch, setIsCreatingNewBranch] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full slide-up">
      <UnderlineNav className="flex-none w-full">
        {activityTabs.map((tab) => (
          <UnderlineNav.Link as="button" className="text-sm" selected={currentTab === tab} mr={0} onClick={() => setCurrentTab(tab)}>
            <Box px={2} fontSize={1} className="!text-gray-700">
              {tab}
            </Box>
          </UnderlineNav.Link>
        ))}
      </UnderlineNav>

      <div className="flex-1 w-full overflow-y-auto">
        {currentTab === "Activity" ? (
          <>
            {isLoadingRepoInfo ? (
              <div className="flex flex-col items-center justify-center h-full w-full">
                <div className="animate-pulse flex space-y-4">
                  <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                  <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                  <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                </div>
              </div>
            ) : (
              <ActivityFeed activity={activity} />
            )}
          </>
        ) : currentTab === "Branches" ? (
          <>
            {isLoadingRepoInfo ? (
              <div className="flex flex-col items-center justify-center h-full w-full">
                <div className="animate-pulse flex space-y-4">
                  <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                  <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                  <div className="rounded-full bg-gray-200 h-12 w-full"></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-stretch pt-2">
                <div className="relative h-12 w-full overflow-x-hidden">
                  <AnimatePresence>
                    {isCreatingNewBranch ? (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 p-1 mx-2 pt-0 flex items-center" onSubmit={e => {
                          e.preventDefault();
                          router.push({
                            pathname: router.pathname,
                            query: {
                              ...router.query,
                              branch: newBranchName
                            }
                          });
                        }}>
                        <button type="button" className="py-1 pr-2" onClick={() => {
                          setIsCreatingNewBranch(false);
                          setNewBranchName("");
                        }}>
                          <XIcon />
                        </button>
                        <input className="pr-24 w-full py-2 px-3 border border-gray-200 focus:border-indigo-300 focus:outline-none rounded-lg" type="text" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} autoFocus />
                        <Button
                          className="!absolute right-2"
                          type="submit">
                          Create
                        </Button>
                      </motion.form>
                    ) : (
                      <motion.div
                        className="mx-2 mb-2"
                        key="button"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}>
                        <Button className="!flex items-center justify-center !py-2 w-full" onClick={() => {
                          setIsCreatingNewBranch(true);
                        }}>
                          <div className="mr-2">
                            <PlusIcon />
                          </div>
                          New branch
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {branches.map((branch) => (
                  <button className="text-sm truncate flex items-center cursor-pointer border border-gray-200 rounded-xl px-3 py-2 m-2 mt-0 hover:bg-gray-100 focus:bg-gray-100"
                    onClick={() => {
                      router.push({
                        pathname: router.pathname,
                        query: {
                          ...router.query,
                          branch: branch.name
                        }
                      }, undefined, { shallow: true });
                    }}>
                    <div className="flex-1 text-left">
                      {branch.name}
                    </div>

                    <div className="ml-2 text-gray-400">
                      <ArrowRightIcon />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
