import { useState, useEffect } from "react";

export default function Sandbox() {
  const [Comp, setComp] = useState(null);

  const handleChange = (e: any) => {
    console.log(e);
  };

  useEffect(() => {
    import("@excalidraw/excalidraw").then((comp) => setComp(comp.default));
  }, []);

  return <>{Comp && <Comp onChange={handleChange} />}</>;
}
