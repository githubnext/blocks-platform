import create from "zustand";
import { immer } from "zustand/middleware/immer";

type BlocksStore = {
  visibility: {
    fileTree: boolean;
    history: boolean;
  };
  actions: {
    toggleFileTree: () => void;
    toggleHistory: () => void;
  };
};

export const useCliStore = create(
  immer<BlocksStore>((set, get) => ({
    visibility: {
      fileTree: true,
      history: true,
    },
    actions: {
      toggleFileTree: () => {
        set((state) => {
          state.visibility.fileTree = !state.visibility.fileTree;
        });
      },
      toggleHistory: () => {
        set((state) => {
          state.visibility.history = !state.visibility.history;
        });
      },
    },
  }))
);

export const useActions = () => useCliStore((state) => state.actions);
export const useVisibility = () => useCliStore((state) => state.visibility);
