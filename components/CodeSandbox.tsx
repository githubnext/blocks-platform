import { ReactNode, useEffect, useState } from "react";
import { getParameters } from "codesandbox/lib/api/define";

export const CodeSandbox = ({
  children,
  language = "js",
  dependencies,
}: {
  children: ReactNode;
  language?: string;
  dependencies?: string[];
}) => {
  const [url, setUrl] = useState("");
  const parameters = getParameters({
    files: {
      "index.js": {
        // @ts-ignore
        content: children?.props?.children?.props?.children,
        isBinary: false,
      },
      "package.json": {
        content: JSON.stringify({
          dependencies: parseDependencies(dependencies),
        }),
        isBinary: false,
      },
    },
  });

  const getSandboxUrl = async () => {
    const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}&json=1`;
    const res = await fetch(url);
    const data = await res.json();
    const id = data?.sandbox_id;
    const iframeUrl = `https://codesandbox.io/embed/${id}?fontsize=14&hidenavigation=1&expanddevtools=1&hidenavigation=1&theme=light`;

    setUrl(iframeUrl);
  };
  useEffect(() => {
    getSandboxUrl();
  }, []);

  return (
    <div className="w-full h-full mt-3 mb-10">
      {!!url && (
        <iframe
          className="w-full h-[14em] outline-none"
          src={url}
          title="CodeSandbox"
          sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
};

const parseDependencies = (dependencies: string[]): Record<string, string> => {
  let res = {};
  dependencies.forEach((dep) => {
    const [name, version = "latest"] = dep.split("@");
    res[name] = version;
  });
  return res;
};
