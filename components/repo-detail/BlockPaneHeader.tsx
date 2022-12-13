import { useContext } from "react";
import dynamic from "next/dynamic";
import { Box, Button, IconButton, Link } from "@primer/react";
import {
  RepoPushIcon,
  ScreenFullIcon,
  ScreenNormalIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
} from "@primer/octicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { getBlockKey } from "hooks";
import type { UseManageBlockResult } from "hooks";
import type { Context } from "./index";
import { AppContext } from "context";
import { Tooltip } from "components/Tooltip";
import { useCommitsPane, useFileTree, useFullscreen } from "state";
import { FloatingDelayGroup } from "@floating-ui/react-dom-interactions";

const BlockPicker = dynamic(() => import("../block-picker"), { ssr: false });

type BlockPaneHeaderProps = {
  manageBlockResult: UseManageBlockResult;
  path: string;
  isFolder: boolean;
  metadata: any;
  setRequestedMetadata: (metadata: any) => void;
  context: Context;
  onSaveChanges: () => void;
};

export default function BlockPaneHeader({
  manageBlockResult,
  path,
  isFolder,
  metadata,
  setRequestedMetadata,
  context,
  onSaveChanges,
}: BlockPaneHeaderProps) {
  const appContext = useContext(AppContext);

  const { block, setBlock, defaultBlock } = manageBlockResult.data ?? {};
  const isDefaultBlock = getBlockKey(block) === getBlockKey(defaultBlock);

  const canSave = appContext.permissions?.push;
  const hasEditPermission = canSave && appContext.hasRepoInstallation;
  const noEditPermissionReason = !canSave
    ? "You don't have permission to update this repo"
    : !appContext.hasRepoInstallation
    ? "The Blocks GitHub app is not installed on this repository"
    : "";

  const { visible: fileTree, toggle: toggleFileTree } = useFileTree();
  const { visible: commitsPane, toggle: toggleCommitsPane } = useCommitsPane();
  const { visible: isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  return (
    <div className="flex-none top-0 z-10">
      <div>
        <Box
          bg="canvas.subtle"
          className="h-panelHeader"
          p={2}
          borderBottom="1px solid"
          borderColor="border.muted"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          {!fileTree && !isFullscreen && (
            <FloatingDelayGroup delay={200}>
              <Tooltip placement="top" label="Open File Tree">
                <div>
                  <IconButton
                    icon={SidebarCollapseIcon}
                    onClick={toggleFileTree}
                    sx={{ mr: 2 }}
                    title={"Open File Tree"}
                  />
                </div>
              </Tooltip>
            </FloatingDelayGroup>
          )}
          <Box display="flex" alignItems="center" className="space-x-2">
            <FloatingDelayGroup delay={200}>
              <TooltipButtonWrapper
                hasTooltip={!hasEditPermission || !onSaveChanges}
                tooltipText={noEditPermissionReason || "No changes to save"}
              >
                <Button
                  disabled={!hasEditPermission || !onSaveChanges}
                  variant="primary"
                  leadingIcon={RepoPushIcon}
                  onClick={onSaveChanges}
                >
                  Save
                </Button>
              </TooltipButtonWrapper>
            </FloatingDelayGroup>
            <BlockPicker
              path={path}
              type={isFolder ? "folder" : "file"}
              onChange={setBlock}
              value={block}
            />
            {!isDefaultBlock && (
              <FloatingDelayGroup delay={200}>
                <TooltipButtonWrapper
                  hasTooltip={!hasEditPermission}
                  tooltipText={noEditPermissionReason}
                >
                  <Button
                    disabled={!hasEditPermission}
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
                </TooltipButtonWrapper>
              </FloatingDelayGroup>
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

          <IconButton
            onClick={toggleFullscreen}
            size="small"
            aria-label={isFullscreen ? "Exit fullscreen" : "Make fullscreen"}
            icon={isFullscreen ? ScreenNormalIcon : ScreenFullIcon}
          />

          {!commitsPane && !isFullscreen && (
            <FloatingDelayGroup delay={200}>
              <Tooltip placement="top-end" label="Open Commits Pane">
                <div>
                  <IconButton
                    icon={SidebarExpandIcon}
                    onClick={toggleCommitsPane}
                    sx={{ ml: 2 }}
                    title={"Open Commits Pane"}
                  />
                </div>
              </Tooltip>
            </FloatingDelayGroup>
          )}
        </Box>
      </div>
    </div>
  );
}

const TooltipButtonWrapper = ({
  hasTooltip,
  tooltipText,
  children,
}: {
  hasTooltip: boolean;
  tooltipText: string;
  children: React.ReactNode;
}) => {
  if (hasTooltip)
    return (
      <Tooltip placement="top" label={tooltipText}>
        {/* Please don't delete this div!!!
          From an a11y perspective, the underlying button shouldn't actually be disabled (but rather use something like aria-disabled),
          since disabled elements don't emit events. But because we don't have the API from @primer/react, we have to stick
          an interim div in there for the events to bubble properly. */}
        <div>{children}</div>
      </Tooltip>
    );
  return <>{children}</>;
};
