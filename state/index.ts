import { useCallback } from "react";
import { useQueryParam, BooleanParam, withDefault } from "use-query-params";

export const useVisibilityQueryParm = ({
  key,
  initialValue = true,
}: {
  key: string;
  initialValue?: boolean;
}) => {
  const [visible, setVisibility] = useQueryParam(
    key,
    withDefault(BooleanParam, initialValue)
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

export const useCommitsPane = () =>
  useVisibilityQueryParm({ key: "commitsPane", initialValue: true });
export const useFileTree = () =>
  useVisibilityQueryParm({ key: "fileTree", initialValue: true });
export const useFullscreen = () =>
  useVisibilityQueryParm({ key: "fullscreen", initialValue: false });
