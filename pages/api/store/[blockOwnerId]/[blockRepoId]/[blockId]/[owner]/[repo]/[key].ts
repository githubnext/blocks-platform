import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { storeDelete, storeGet, storeSet } from "lib/table-service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (!session) {
    res.status(401).send("Unauthorized.");
    return;
  }

  const { blockOwnerId, blockRepoId, blockId, owner, repo, key } =
    req.query as Record<string, string>;

  switch (req.method) {
    case "GET":
      const value = await storeGet({
        blockOwnerId,
        blockRepoId,
        blockId,
        owner,
        repo,
        key,
      });
      res.status(200).send(value);
      return;

    case "PUT":
      await storeSet({
        blockOwnerId,
        blockRepoId,
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
        blockOwnerId,
        blockRepoId,
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
