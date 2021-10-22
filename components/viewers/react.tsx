import { useSandboxedComponent } from "hooks";
import { ViewerProps } from ".";

export default function ReactViewer({ contents, meta }: ViewerProps) {
  const { name } = meta;
  const componentName = name.split("/").pop().split(".")[0];

  const { data, status } = useSandboxedComponent({
    owner: meta.owner,
    repo: meta.repo,
    path: meta.path,
  });

  console.log(data?.sandboxUrl);

  return (
    <>
      {status === "loading" && (
        <div className="p-4 text-gray-600 text-sm">Loading...</div>
      )}
      {status === "success" && data && (
        <iframe
          src={data.sandboxUrl.replace("example.jsx", "index.js")}
          className="flex-1 w-full h-full"
        />
      )}
    </>
  );
}
