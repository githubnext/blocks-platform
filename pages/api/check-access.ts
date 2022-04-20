import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { makeAppOctokit } from "../../lib/auth";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { repo, owner } = req.query as Record<string, string>;
  const session = await getSession({ req });

  if (!session) {
    res.status(401).send("Unauthorized.");
    return;
  }

  const appOctokit = makeAppOctokit();

  try {
    await appOctokit.apps.getRepoInstallation({ owner, repo });
    res.status(200).send(true);
    return;
  } catch (e) {
    res.status(200).send(false);
  }
};
