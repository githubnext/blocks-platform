import { useContext } from "react";
import { useRouter } from "next/router";
import { default as NextLink } from "next/link";
import dynamic from "next/dynamic";
import { Box, Button, Link } from "@primer/react";
import {
  RepoPushIcon,
  ScreenFullIcon,
  ScreenNormalIcon,
} from "@primer/octicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { getBlockKey } from "hooks";
import type { UseManageBlockResult } from "hooks";
import type { Context } from "./index";
import { AppContext } from "context";
import { Tooltip } from "components/Tooltip";

const BlockPicker = dynamic(() => import("../block-picker"), { ssr: false });

type BlockPaneHeaderProps = {
  manageBlockResult: UseManageBlockResult;
  isFullscreen: boolean;
  path: string;
  isFolder: boolean;
  token: string;
  metadata: any;
  setRequestedMetadata: (metadata: any) => void;
  context: Context;
  onSaveChanges: () => void;
};

export default function BlockPaneHeader({
  manageBlockResult,
  isFullscreen,
  path,
  isFolder,
  token,
  metadata,
  setRequestedMetadata,
  context,
  onSaveChanges,
}: BlockPaneHeaderProps) {
  const router = useRouter();
  const appContext = useContext(AppContext);

  const { block, setBlock, defaultBlock } = manageBlockResult.data ?? {};
  const isDefaultBlock = getBlockKey(block) === getBlockKey(defaultBlock);

  const canSave = appContext.permissions?.push;

  return (
    <div className="flex-none top-0 z-10">
      <div>
        <Box
          bg="canvas.subtle"
          p={2}
          borderBottom="1px solid"
          borderColor="border.muted"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box display="flex" alignItems="center" className="space-x-2">
            {!canSave || !appContext.hasRepoInstallation ? (
              <Tooltip
                side="top"
                text={
                  !canSave
                    ? "You don't have permission to update this repo"
                    : !appContext.hasRepoInstallation
                    ? "The Blocks GitHub app is not installed on this repository"
                    : null
                }
              >
                <div className="pointer-events-[all]">
                  <Button
                    variant="primary"
                    leadingIcon={RepoPushIcon}
                    disabled
                    className="pointer-events-none"
                  >
                    Save
                  </Button>
                </div>
              </Tooltip>
            ) : (
              <Button
                key={"Save"}
                variant={"primary"}
                leadingIcon={RepoPushIcon}
                disabled={!onSaveChanges}
                onClick={onSaveChanges}
              >
                Save
              </Button>
            )}
            <BlockPicker
              path={path}
              type={isFolder ? "folder" : "file"}
              onChange={setBlock}
              value={block}
            />
            {!isDefaultBlock && token && (
              <Button
                disabled={!appContext.hasRepoInstallation}
                onClick={() => {
                  const newMetadata = {
                    ...metadata,
                    [path]: {
                      ...metadata[path],
                      default: getBlockKey(block),
                    },
                  };
                  setRequestedMetadata(newMetadata);
                }}
              >
                Make default
              </Button>
            )}
          </Box>
          <AnimatePresence initial={false}>
            {isFullscreen && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "tween",
                    duration: 0.1,
                    delay: 0.2,
                  },
                }}
                exit={{
                  opacity: 0,
                  y: 5,
                  transition: {
                    type: "tween",
                    duration: 0.1,
                    delay: 0.2,
                  },
                }}
              >
                <Box className="text-sm text-gray-500 ml-2">
                  {context.owner}/{context.repo}: {path}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
          <Link
            href={`https://github.com/${context.owner}/${context.repo}/${
              path ? `blob/${context.sha}/${path}` : ""
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className="!text-gray-500 mr-3 ml-auto text-xs"
          >
            View on GitHub
          </Link>
          <NextLink
            shallow
            href={{
              pathname: router.pathname,
              query: {
                ...router.query,
                mode: isFullscreen ? undefined : "fullscreen",
              },
            }}
          >
            <span
              className="text-gray-500 text-xs ml-2 mr-3 cursor-pointer"
              title={isFullscreen ? "Exit fullscreen" : "Make fullscreen"}
            >
              {isFullscreen ? <ScreenNormalIcon /> : <ScreenFullIcon />}
            </span>
          </NextLink>
        </Box>
      </div>
    </div>
  );
}
