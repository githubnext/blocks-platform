import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { makeAppOctokit } from "../../lib/auth";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { repo, owner } = req.query as Record<string, string>;
  const session = await getSession({ req });

  if (!session) {
    res.status(401).send("Unauthorized.");
  }

  const appOctokit = makeAppOctokit();

  try {
    const repoInstallationRes = await appOctokit.apps.getRepoInstallation({
      owner,
      repo,
    });
    const repoInstallation = repoInstallationRes.data;
    const hasAccess =
      repoInstallation &&
      // the installation is not necessarily accessible to the user
      repoInstallation.account.id === session.user.id;
    res.status(200).send(hasAccess);
  } catch (e) {
    res.status(200).send(false);
  }
};
