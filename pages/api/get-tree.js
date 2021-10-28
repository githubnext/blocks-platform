import { stratify } from 'd3';
import { Octokit } from "@octokit/rest";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// get env variable
const GITHUB_PAT = process.env.NEXT_PUBLIC_GITHUB_PAT;
export const octokit = new Octokit({
  // AUTH GOES HERE
  auth: GITHUB_PAT
});

export default async function getInfo(req, res) {
  const { owner, repo } = req.query;

  const branch = "HEAD"

  const GITHUB_PAT = process.env.NEXT_PUBLIC_GITHUB_PAT;
  // the octokit API doesn't seem to surface this recursive endpoint
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const fileTree = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_PAT}`,
    },
  }).then(res => res.json());
  const files = nestFileTree(fileTree, repo);

  try {
    const commitsRes = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 20,
      sha: branch,
    });

    const commits = commitsRes.data.map(commit => ({
      date: commit.commit.author.date,
      message: commit.commit.message,
      sha: commit.sha,
    }))

    let fileChanges = {}
    for (let commit of [...commits].reverse()) {
      try {
        const commitInfo = await octokit.repos.getCommit({
          owner,
          repo,
          ref: commit.sha,
        });
        const files = commitInfo.data.files
        files.forEach(file => {
          fileChanges[file.filename] = commit
        })
      } catch (e) {
        console.log(e);
      }
    }

    res.status(200).json({ files, commits, fileChanges })
  } catch (e) {
    console.log(e);
    res.status(200).json({ files, commits: [], fileChanges: {} })
  }
}


export const nestFileTree = (fileTree, repoName) => {
  const leaves = [
    ...(fileTree.tree || []).map(d => ({
      name: d.path.split('/').pop(),
      path: d.path,
      parent: d.path.split('/').slice(0, -1).join('/') || repoName,
      size: d.size || 0,
      children: [],
    })),
    {
      name: repoName,
      path: repoName,
      parent: null,
      size: 0,
      children: [],
    },
  ];
  // .filter(d => !foldersToIgnore.find(f => d.path.startsWith(f)))

  const tree = stratify()
    .id(d => d.path)
    .parentId(d => d.parent)(leaves);

  const convertStratifyItem = d => ({
    ...d.data,
    children: d.children?.map(convertStratifyItem) || [],
  });

  const data = convertStratifyItem(tree).children;

  return data;
};
