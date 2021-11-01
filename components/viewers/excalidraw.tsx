import { Button } from "@primer/components";
import { useUpdateFileContents } from "hooks";
import { useState, useEffect, useRef } from "react";
import { ViewerProps } from ".";

const allowList = ["excalidraw"];

export function ExcalidrawViewer(props: ViewerProps) {
  const { contents, meta } = props;
  const extension = meta.name.split(".").pop();
  const serializeAsJSON = useRef(null);

  if (!allowList.includes(extension)) {
    return (
      <div className="p-8 text-gray-500 text-sm">
        We can't display that file, sorry.
      </div>
    );
  }

  const [appState, setAppState] = useState(null);
  const [elements, setElements] = useState([]);

  const [Comp, setComp] = useState(null);

  const handleChange = (elements: any, appState: any) => {
    setElements(elements);
    setAppState(appState);
  };

  useEffect(() => {
    import("@excalidraw/excalidraw").then((comp) => {
      setComp(comp.default);
      serializeAsJSON.current = comp.serializeAsJSON;
    });
  }, []);

  const { mutateAsync } = useUpdateFileContents({
    onSuccess: () => {},
    onError: (e) => {},
  });

  const handleSave = async () => {
    if (!serializeAsJSON.current) return;
    const serialized = serializeAsJSON.current(elements, appState);
    await mutateAsync({
      content: serialized,
      owner: meta.owner,
      repo: meta.repo,
      path: meta.name,
      sha: meta.sha,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
      <div className="flex-1">
        {Comp && (
          <Comp initialData={JSON.parse(contents)} onChange={handleChange} />
        )}
      </div>
    </div>
  );
}
