import { makeOctokitInstance } from "ghapi";
import { makeAppOctokit } from "lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { repo, owner, installationId } = req.query;
  const session = await getSession({ req });

  if (!session) {
    res.status(401).send("Unauthorized.");
    return;
  }

  const appOctokit = makeAppOctokit(parseInt(installationId as string));

  let repoId;

  try {
    const repoInfo = await appOctokit.repos.get({
      repo: repo as string,
      owner: owner as string,
    });
    repoId = repoInfo.data.id;
  } catch (e) {
    console.log(e);
    res.status(400).json("Failed to fetch repo info");
    return;
  }

  try {
    const addRepoRes =
      await appOctokit.rest.apps.addRepoToInstallationForAuthenticatedUser({
        // @ts-ignore
        installation_id: parseInt(installationId as string),
        repository_id: repoId,
      });
    res.status(200).json(addRepoRes.data);
    return;
  } catch (e) {
    console.log(e);
    res.status(400).json("Failed to add repo");
    return;
  }
};
