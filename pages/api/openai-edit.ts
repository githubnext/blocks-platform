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
    console.log(e.response.data);
    res.status(500).send("Unable to get explanation.");
    return;
  }
}
