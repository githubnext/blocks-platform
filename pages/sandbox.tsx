import axios from "axios";
import { useSession } from "next-auth/react";
import { useQuery } from "react-query";

const functionToExplain = `function slugify(text)
{
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
`;

async function getExplanation(code: string) {
  const res = await axios.post(`/api/explain`, {
    code,
    language: "javascript",
  });
  return res.data;
}

function SandboxInner() {
  const { data, status } = useQuery(
    ["explanation"],
    () => getExplanation(functionToExplain),
    {
      refetchOnWindowFocus: false,
    }
  );
  return (
    <div className="p-4 space-y-4">
      <pre className="bg-gray-100 border text-sm p-4">{functionToExplain}</pre>
      {status === "loading" && (
        <p className="text-sm text-gray-600">Loading...</p>
      )}
      {status === "success" && data && (
        <div className="whitespace-pre-wrap">{data}</div>
      )}
    </div>
  );
}

export default function Sandbox() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return <SandboxInner />;
  }

  return null;
}
