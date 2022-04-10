import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { type, owner, repo, id } = req.query;
  const url = `${process.env.NEXT_PUBLIC_MARKETPLACE_URL}/api/get-block-content?owner=${owner}&repo=${repo}&id=${id}`;
  const json = await (await fetch(url)).json();
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
