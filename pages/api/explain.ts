import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import axios from "axios";

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

  const token = await getCopilotToken(session);
  if (!token) {
    res.status(401).send("Unauthorized.");
    return;
  }

  const {
    language = "javascript",
    prompt = `/* Here is the explanation for the code above:\n1.`,
    stop = [`*/`], // this marker changes based on the language
  } = req.body;

  try {
    const url =
      "https://copilot-proxy.githubusercontent.com/v1/engines/copilot-codex/completions";
    const body = {
      prompt,
      suffix: "",
      max_tokens: 2015,
      temperature: 0.5,
      top_p: 1,
      n: 1,
      stop,
      stream: true,
      extra: { language, force_index: -1 },
    };
    const headers = {
      Authorization: `Bearer ${token}`,
      "Openai-Organization": "github-copilot",

      // these shouldn't be necessary, but are sent by Copilot Labs
      // "X-Request-Id": "10d6406c-b7f0-4583-8894-0c7486f792f3",
      // "X-Request-Start": "t=1649802307803",
      // "VScode-SessionId": "d71c3cb1-154b-45eb-a1fe-e85a92f7e08a1649802262176",
      // "VScode-MachineId":
      //   "72f0c2d61af22e56b74803441de5ffd8c071abd61c9c6818b3fe8ed6f6c47be8",
      // "Editor-Version": "vscode/1.66.0",
      // "Editor-Plugin-Version": "copilot/0.0.8",
      // "OpenAI-Intent": "copilot-sidebar",
    };

    // we're ignoring streaming for now, for simplicity
    const timeout = 30 * 1000; // 30 seconds
    const response = await axios.post(url, body, { headers, timeout });
    const data = await response.data;
    const [dataLines] = splitChunk(data);
    let completion = "";
    for (const dataLine of dataLines) {
      const lineWithoutData = dataLine.slice("data:".length).trim();
      try {
        const json: ResponseChunk = JSON.parse(lineWithoutData);
        const choice = json.choices[0];
        const finishReason = choice.finish_reason;
        if (!finishReason) {
          completion += choice.text || "";
        }
        if (finishReason === "stop") {
          completion += choice.text || "";
          break;
        }
      } catch (e) {
        console.error(e);
      }
    }

    res.status(200).json(completion);
    return;
  } catch (e) {
    console.log(e);
    res.status(500).send("Unable to get explanation.");
    return;
  }
}

type ResponseChunk = {
  id: string;
  model: string;
  created: number;
  choices: {
    text: string;
    index: number;
    finish_reason: "stop" | null;
    logprobs: string | null;
  }[];
};

// Copped from the Copilot Labs codebase
// https://github.com/github/copilot-labs/blob/1b56ea0bfae275084b06433e591080a6b9729e93/lib/src/openai/stream.ts#L20
// Given a string of lines separated by one or more newlines, returns complete
// lines and any remaining partial line data.
export function splitChunk(chunk: string): [string[], string] {
  const dataLines = chunk.split("\n");
  const newExtra = dataLines.pop(); // will be empty string if chunk ends with "\n"
  return [dataLines.filter((line) => line != ""), newExtra!];
}

const getCopilotToken = async (session: any) => {
  // our oauth token doesn't have access to this endpoint
  // even after giving the app `read:user` scpe
  const url = "https://api.github.com/copilot_internal/v2/token";
  const githubToken = session.token;

  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `token ${githubToken}`,
      },
    });
    return res.data.token;
  } catch (e) {
    console.error(e);
    return null;
  }
};
