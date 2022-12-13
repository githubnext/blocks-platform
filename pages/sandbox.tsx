import {
  ScreenFullIcon,
  ScreenNormalIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
} from "@primer/octicons-react";
import { IconButton } from "@primer/react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useCommitsPane, useFileTree, useFullscreen } from "state";

const ToggleCommitsPaneButton = () => {
  const { toggle, visible } = useCommitsPane();
  return (
    <IconButton
      onClick={toggle}
      icon={visible ? SidebarCollapseIcon : SidebarExpandIcon}
    />
  );
};

const ToggleFileTreeButton = () => {
  const { toggle, visible } = useFileTree();
  return (
    <IconButton
      onClick={toggle}
      icon={visible ? SidebarExpandIcon : SidebarCollapseIcon}
    />
  );
};

const ToggleFullscreenButton = () => {
  const { toggle, visible } = useFullscreen();
  const icon = visible ? ScreenNormalIcon : ScreenFullIcon;
  return <IconButton onClick={toggle} icon={icon} />;
};

export function FMSandbox() {
  const { visible: isFullscreen } = useFullscreen();
  const { visible: commitsPane } = useCommitsPane();
  const { visible: fileTree } = useFileTree();

  return (
    <MotionConfig
      transition={{ duration: 0.3, type: "tween", ease: "easeOut" }}
    >
      <div className="h-screen overflow-hidden flex flex-col">
        <AnimatePresence mode="popLayout">
          {!isFullscreen && (
            <motion.div
              exit={{ opacity: 0, y: "-100%" }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black h-12 flex-shrink-0"
              key="app-header"
            ></motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="popLayout">
          {!isFullscreen && (
            <motion.div
              exit={{ opacity: 0, y: "-100%" }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-100 h-32 border-b"
              key="repo-header"
            ></motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-1 divide-x">
          {/* Left pane */}
          {fileTree && !isFullscreen && (
            <motion.aside className="w-64 flex-shrink-0" key="commits-pane">
              <div className="p-4 border-b text-right">
                <ToggleFileTreeButton />
              </div>
            </motion.aside>
          )}

          {/* Middle pane */}
          <motion.main
            layout
            className="flex-1 flex-shrink-0 bg-white"
            key="blocks-pane"
          >
            <header className="p-4 flex justify-between border-b space-x-4">
              <AnimatePresence>
                {!fileTree && !isFullscreen && (
                  <motion.div exit={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ToggleFileTreeButton />
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div layout className="flex-1 flex justify-end">
                <ToggleFullscreenButton />
              </motion.div>
              <AnimatePresence>
                {!commitsPane && !isFullscreen && (
                  <motion.div exit={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <ToggleCommitsPaneButton />
                  </motion.div>
                )}
              </AnimatePresence>
            </header>
          </motion.main>

          {/* Right Pane */}
          {commitsPane && !isFullscreen && (
            <motion.aside className="w-64 flex-shrink-0" key="file-pane">
              <div className="p-4 border-b">
                <ToggleCommitsPaneButton />
              </div>
            </motion.aside>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}

export default function Sandbox() {
  return <FMSandbox />;
}
