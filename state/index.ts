import { useCallback } from "react";
import { useQueryParam, BooleanParam, withDefault } from "use-query-params";

export const useCommitsPane = () => {
  const [visible, setVisibility] = useQueryParam(
    "commitsPane",
    withDefault(BooleanParam, false)
  );

  const toggle = useCallback(() => {
    setVisibility(!visible);
  }, [visible]);

  return {
    visible,
    setVisibility,
    toggle,
  };
};

export const useFileTree = () => {
  const [visible, setVisibility] = useQueryParam(
    "fileTree",
    withDefault(BooleanParam, false)
  );

  const toggle = useCallback(() => {
    setVisibility(!visible);
  }, [visible]);

  return {
    visible,
    setVisibility,
    toggle,
  };
};

export const useFullscreen = () => {
  const [visible, setVisibility] = useQueryParam(
    "fullscreen",
    withDefault(BooleanParam, false)
  );

  const toggle = useCallback(() => {
    setVisibility(!visible);
  }, [visible]);

  return {
    visible,
    setVisibility,
    toggle,
  };
};
