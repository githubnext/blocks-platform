import { makeOctokitInstance } from "ghapi";
import type { NextApiRequest, NextApiResponse } from "next";
import { makeAppOctokit } from "../../lib/auth";
import { getSessionOnServer } from "./auth/[...nextauth]";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { repo, owner } = req.query as Record<string, string>;
  const session = await getSessionOnServer(req);

  if (!session) {
    res.status(401).send("Unauthorized.");
    return;
  }

  try {
    const appOctokit = makeAppOctokit({ type: "app" });
    // find the installation for the repo
    const _repoInstallationRes = await appOctokit.apps.getRepoInstallation({
      owner,
      repo,
    });
    res.status(200).send(true);
  } catch (e) {
    res.status(200).send(false);
  }
};
