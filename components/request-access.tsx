import axios from "axios";
import { useMutation } from "react-query";

const requestAccess = async ({ repo, owner, installationId }) => {
  await axios.get(`/api/add-repo`, {
    params: {
      repo,
      owner,
      installationId,
    },
  });
};

export function RequestAccess({
  installationId,
  owner,
  repo,
}: {
  installationId: number;
  repo: string;
  owner: string;
}) {
  const { status, data, mutate } = useMutation(requestAccess);

  return (
    <div>
      <button
        disabled={status === "loading"}
        onClick={() => mutate({ installationId, repo, owner })}
        className="bg-black p-2 text-white rounded"
      >
        {status === "loading" ? "Loading..." : "Request Access"}
      </button>
    </div>
  );
}
