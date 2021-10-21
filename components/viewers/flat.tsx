import { useMemo } from "react";
import { Grid } from "@githubocto/flat-ui";

export function FlatViewer({ contents }: { contents: string }) {
  const data = useMemo(() => {
    try {
      return JSON.parse(contents);
    } catch (e) {
      return [];
    }
  }, [contents]);
  console.log(data);

  return <Grid data={data} />;
}
