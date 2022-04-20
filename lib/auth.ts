import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

// This is a new
export const makeAppOctokit = () =>
  new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
  });
