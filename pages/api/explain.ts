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

  const {
    code,
    language,
    prompt = `/* Here is the explanation for the code above:\n1.`,
    stop = `*/`, // this marker changes based on the language
  } = req.body;

  try {
    const completion = await openai.createCompletion("code-davinci-001", {
      prompt: `// Language: ${language}\n${code}\n\n${prompt}`,
      stop,
      max_tokens: 2000, // prompt + max_tokens (tokens in completion) <= 2048 (2048 is the max the openAI model accepts)
      temperature: 0.5,
      top_p: 1,
      n: 1,
    });

    res.status(200).json(completion.data.choices[0].text);
    return;
  } catch {
    res.status(500).send("Unable to get explanation.");
    return;
  }
}
