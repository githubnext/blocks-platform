import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { type, owner, repo, id } = req.query;
  const domain = req.headers.host;
  const protocol = req.headers.httpVersionMajor === "2" ? "https" : "http";
  const url = `${protocol}://${domain}/api/get-block-content?owner=${owner}&repo=${repo}&id=${id}`;

  const authorization: Record<string, string> = req.headers["authorization"]
    ? { authorization: req.headers["authorization"] }
    : {};

  const json = await (
    await fetch(url, {
      headers: authorization,
    })
  ).json();
  const content = json.content.find((c) => c.name.endsWith(type)).content;

  if (type === "js") {
    const script = `
var BlockBundle = ({ React }) => {
  function require(name) {
    switch (name) {
      case "react":
        return React;
      default:
        console.log("no module '" + name + "'");
        return null;
    }
  }
${content}
  return BlockBundle;
};
`;

    res.setHeader("Cache-Control", "max-age=3600");
    res.setHeader("Content-Type", "application/javascript");
    res.end(script);
  } else if (type === "css") {
    res.setHeader("Cache-Control", "max-age=3600");
    res.setHeader("Content-Type", "text/css");
    res.end(content);
  }
};
