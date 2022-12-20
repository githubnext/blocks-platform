import tar from "tar-stream";
import streamifier from "streamifier";
import { unzipSync } from "zlib";
import { getSessionOnServer } from "./auth/[...nextauth]";
import type { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import sanitizeId from "utils/sanitize-id";

type Data = {
  content?: {
    name: string;
    content: string;
  }[];
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // cache for 30 minutes
  res.setHeader("Cache-Control", "max-age=1800, immutable");

  const session = await getSessionOnServer(req);
  if (!session || !session.hasAccess) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  await new Promise((resolve, reject) => {
    Cors({
      // Only allow requests with GET
      methods: ["GET"],
    })(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  const { owner, repo, id } = req.query as Record<string, string>;

  const apiBaseUrl = `https://api.github.com/repos/${sanitizeId(
    owner
  )}/${sanitizeId(repo)}`;

  // @ts-ignore
  const releaseInfoUrl = `${apiBaseUrl}/releases/latest`;
  const releaseInfo = await fetch(releaseInfoUrl, {
    headers: {
      Authorization: `token ${session.userToken}`,
    },
  }).then((r) => r.json());

  const assets = releaseInfo.assets || [];
  const asset = assets.find((a: any) => a.name === `${id}.tar.gz`);
  if (!asset) {
    res.status(404).json({
      message: `No asset with name ${id}.tar.gz found`,
    });
    return;
  }
  const assetUrl = `${apiBaseUrl}/releases/assets/${asset.id}`;

  const assetContentRes = await fetch(assetUrl, {
    headers: {
      Authorization: `token ${session.userToken}`,
      Accept: "application/octet-stream",
    },
  });
  if (assetContentRes.status !== 200) {
    res.status(404).json({
      message: `We had trouble downloading an asset from ${assetUrl}`,
    });
  }
  // @ts-ignore
  const buffer = await assetContentRes.buffer();
  const text = await untar(buffer);

  res.status(200).json({ content: text });
}

const untar = (buffer: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // Buffer is representation of .tar.gz file uploaded to Express.js server
    // using Multer middleware with MemoryStorage
    const textData = [] as { name: string; content: string }[];
    const extract = tar.extract();
    // Extract method accepts each tarred file as entry, separating header and stream of contents:
    extract.on("entry", (header: any, stream: any, next: any) => {
      const chunks = [] as Uint8Array[];
      stream.on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      });
      stream.on("error", (err: any) => {
        reject(err);
      });
      stream.on("end", () => {
        // We concatenate chunks of the stream into string and push it to array, which holds contents of each file in .tar.gz:
        const text = Buffer.concat(chunks).toString("utf8");
        textData.push({ name: header.name, content: text });
        next();
      });
      stream.resume();
    });
    extract.on("finish", () => {
      // We return array of tarred files's contents:
      resolve(textData);
    });
    // We unzip buffer and convert it to Readable Stream and then pass to tar-stream's extract method:
    streamifier.createReadStream(unzipSync(buffer)).pipe(extract);
  });
};
