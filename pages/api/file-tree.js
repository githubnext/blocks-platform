import { stratify, timeParse } from "d3";

export default async function getInfo(req, res) {
  const { owner, repo, token } = req.query;

  const branch = "HEAD";

  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const fileTree = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => res.json());

  const files = nestFileTree(fileTree, repo);

  res.status(200).json({ files });
}

export const nestFileTree = (fileTree, repoName) => {
  const leaves = [
    ...(fileTree.tree || []).map((d) => ({
      name: d.path.split("/").pop(),
      path: d.path,
      parent: d.path.split("/").slice(0, -1).join("/") || repoName,
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
    .id((d) => d.path)
    .parentId((d) => d.parent)(leaves);

  const convertStratifyItem = (d) => ({
    ...d.data,
    children: d.children?.map(convertStratifyItem) || [],
  });

  const data = convertStratifyItem(tree).children;

  return data;
};
