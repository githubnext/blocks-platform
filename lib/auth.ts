import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

// This Octokit instance is used to make authenticated requests via JWT to select endpoints on the GitHub API.
// (JWT, meaning time based token signed by the GitHub App's private certificate).
export const makeAppOctokit = (
  params: {
    installationId?: number;
    type?: "app" | "oauth-app" | "installation" | "oauth-user";
  } = {}
) =>
  new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ...params,
    },
  });
