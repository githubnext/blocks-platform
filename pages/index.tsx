import { FileForm } from "components/file-form";
import { FileViewer } from "components/file-viewer";
import { useFileContent } from "hooks";
import { useState } from "react";

export default function Home() {
  const [state, setState] = useState({ repo: "", owner: "", path: "" });

  const { data, status } = useFileContent(state, {
    enabled: Object.values(state).every(Boolean),
  });

  return (
    <div className="bg-white">
      <div className="p-4">
        <FileForm onSubmit={setState} />
      </div>
      <div className="p-4">
        {status === "loading" && <p className="text-sm">Loading...</p>}
        {status === "success" && <FileViewer data={data} />}
      </div>
    </div>
  );
}
