import { timeParse } from "d3";
import { Octokit } from "@octokit/rest";

export default async function getInfo(req, res) {
  const { owner, repo, path, token } = req.query;

  const branch = "HEAD";

  const octokit = new Octokit({
    auth: token,
  });

  try {
    const commitsRes = await octokit.repos.listCommits({
      owner,
      repo,
      path,
      per_page: 20,
      sha: branch,
    });

    const commits = commitsRes.data.map((commit) => ({
      date: commit.commit.author.date,
      username: commit.author?.login,
      message: commit.commit.message,
      url: commit.html_url,
      sha: commit.sha,
    }));

    res.status(200).json({ commits });
  } catch (e) {
    res.status(Number(e.status)).json({ message: e.message });
  }
}
