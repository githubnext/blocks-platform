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

  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  if (!session?.user.isHubber) {
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
    const completion = await openai.createCompletion("davinci-codex-002-msft", {
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
