import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  if (!session) {
    res.status(401).send("Unauthorized.");
    return;
  }

  try {
    const response = await openai.createCompletion("cushman-codex-msft", {
      prompt:
        req.body.code +
        `\n\n\"\"\"\nHere's a plain english explanation of the code above:\n\n1.`,
      temperature: 0,
      max_tokens: 64,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      // Should we make this configurable?
      stop: ['"""'],
    });
    res.status(200).json(response.data);
    return;
  } catch (e) {
    res.status(500).send(e);
    return;
  }
}
