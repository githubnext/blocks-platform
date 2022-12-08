import create from "zustand";
import { immer } from "zustand/middleware/immer";

type BlocksStore = {
  visibility: {
    fileTree: boolean;
    commitsPane: boolean;
  };
  actions: {
    toggleFileTree: () => void;
    toggleCommitsPane: () => void;
  };
};

export const useCliStore = create(
  immer<BlocksStore>((set, get) => ({
    visibility: {
      fileTree: true,
      commitsPane: true,
    },
    actions: {
      toggleFileTree: () => {
        set((state) => {
          state.visibility.fileTree = !state.visibility.fileTree;
        });
      },
      toggleCommitsPane: () => {
        set((state) => {
          state.visibility.commitsPane = !state.visibility.commitsPane;
        });
      },
    },
  }))
);

export const useActions = () => useCliStore((state) => state.actions);
export const useVisibility = () => useCliStore((state) => state.visibility);
