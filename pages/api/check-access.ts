import { Endpoints } from "@octokit/types";
import { makeOctokitInstance } from "ghapi";
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { makeAppOctokit } from "../../lib/auth";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { repo, owner } = req.query as Record<string, string>;
  const session = await getSession({ req });

  if (!session) {
    res.status(401).send("Unauthorized.");
  }

  try {
    const installation = await getUserInstallationForRepo({
      token: session?.token as string,
      owner,
      repo,
    });
    res.status(200).send(!!installation);
  } catch (e) {
    res.status(200).send(false);
  }
};

type InstallationsResponse =
  Endpoints["GET /user/installations"]["response"]["data"];
export type Installation = InstallationsResponse["installations"][0];

// we want to find an installation that has access to the repo
// that the user also has access to
export const getUserInstallationForRepo = async ({
  token,
  owner,
  repo,
}: {
  token: string;
  owner: string;
  repo: string;
}): Promise<Installation | undefined> => {
  try {
    const appOctokit = makeAppOctokit({
      type: "app",
    });

    // find the installation for the repo
    const repoInstallationRes = await appOctokit.apps.getRepoInstallation({
      owner,
      repo,
    });

    const userOctokit = makeOctokitInstance(token);

    // find installations that the user has access to
    // we'll need to deal with pagination
    const userInstallationsRes =
      await userOctokit.apps.listInstallationsForAuthenticatedUser();
    const userInstallations = userInstallationsRes.data.installations;

    // see if the user has access to the repo installation
    // (this is assuming that there can only be one installation per repo)
    const userInstallationRes = userInstallations.find(
      (installation) => installation.id === repoInstallationRes.data.id
    );

    return userInstallationRes;
  } catch (e) {
    return undefined;
  }
};
