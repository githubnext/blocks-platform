import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionOnServer } from "../../../../../../auth/[...nextauth]";
import { makeOctokitInstance } from "ghapi";
import { storeDelete, storeGet, storeSet } from "lib/table-service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSessionOnServer(req);
  if (!session) {
    res.status(401).send("Unauthorized.");
    return;
  }

  const { blockOwner, blockRepo, blockId, owner, repo, key } =
    req.query as Record<string, string>;

  try {
    const octokit = makeOctokitInstance(session.token as string);
    await octokit.repos.get({ owner, repo });
  } catch (e) {
    res.status(401).send("Unauthorized.");
    return;
  }

  switch (req.method) {
    case "GET":
      const value = await storeGet({
        blockOwner,
        blockRepo,
        blockId,
        owner,
        repo,
        key,
      });
      if (value === undefined) {
        res.status(404).end();
      } else {
        res.status(200).send(value);
      }
      return;

    case "PUT":
      await storeSet({
        blockOwner,
        blockRepo,
        blockId,
        owner,
        repo,
        key,
        value: req.body,
      });
      res.status(200).end();
      return;

    case "DELETE":
      await storeDelete({
        blockOwner,
        blockRepo,
        blockId,
        owner,
        repo,
        key,
      });
      res.status(200).end();
      return;

    default:
      res.status(405).send("Method not allowed");
      return;
  }
}
