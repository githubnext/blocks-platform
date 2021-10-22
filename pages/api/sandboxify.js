import { assembleFilesAndPost } from "codesandboxer-fs";
import simpleGit from "simple-git";
import fs from "fs";
const git = simpleGit();

export default async function helloAPI(req, res) {
  const { path, owner, repo } = req.query;

  if (fs.existsSync(repo)) {
    fs.rmdirSync(repo, { recursive: true });
  }

  await git.clone(`https://github.com/${owner}/${repo}`);

  const payload = await assembleFilesAndPost(`./${repo}/${path}`);

  res.status(200).json(payload);
}
