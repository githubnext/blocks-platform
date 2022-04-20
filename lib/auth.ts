import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

export const makeAppOctokit = (installationId?: number) =>
  new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n"),
      // Optionally add the installationId param
      ...(installationId ? { installationId } : {}),
    },
  });
