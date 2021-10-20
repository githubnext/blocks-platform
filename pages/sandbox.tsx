import { useFileContent } from "hooks";

export default function Sandbox() {
  const { data, status } = useFileContent({
    repo: "react-overflow-list",
    owner: "mattrothenberg",
    path: "README.md",
  });

  return <div></div>;
}
