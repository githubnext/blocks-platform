import { useFileContent } from "hooks";
import { FolderViewerProps } from ".";

export function CypressViewer(props: FolderViewerProps) {
  const { meta } = props;
  const { owner, repo } = meta;
  const { data, status } = useFileContent({
    owner,
    repo,
    path: "cypress.json",
  });

  const cypressConfig =
    data && data[0]
      ? JSON.parse(Buffer.from(data[0].content, "base64").toString())
      : null;

  return (
    <>
      {status === "loading" && (
        <div className="p-4 text-sm text-gray-600">
          Fetching Cypress config...
        </div>
      )}
      {status === "success" && cypressConfig && (
        <div className="flex-1 h-full">
          <iframe
            className="h-full w-full"
            src={`https://dashboard.cypress.io/projects/${cypressConfig?.projectId}`}
            frameBorder="0"
          ></iframe>
        </div>
      )}
    </>
  );
}
