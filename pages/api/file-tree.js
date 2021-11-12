export default async function getInfo(req, res) {
  const { owner, repo, token } = req.query;

  const branch = "HEAD";

  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const fileTreeRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const fileTree = await fileTreeRes.json();
  if (fileTree.message) {
    res.status(fileTreeRes.status).json(fileTree);
    return;
  }

  const files = fileTree.tree;

  res.status(200).json({ files });
}
