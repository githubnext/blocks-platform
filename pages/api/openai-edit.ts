import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";
import { getSessionOnServer } from "./auth/[...nextauth]";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: "org-rocrupyvzgcl4yf25rqq6d1v",
});

const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSessionOnServer(req);
  if (!session || !session.hasAccess || !session?.user.isHubber) {
    res.status(401).send("Unauthorized.");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const { input, instruction } = req.body;

  try {
    const openAIRes = await openai.createEdit("code-davinci-edit-001", {
      input,
      instruction,
      temperature: 0.5,
      top_p: 1,
    });

    res.status(200).json(openAIRes.data.choices[0].text);
    return;
  } catch (e) {
    res.status(500).send("Unable to get explanation.");
    return;
  }
}
