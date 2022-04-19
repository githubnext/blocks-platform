import https from "https";
import fs from "fs";

const fullRepo = "githubnext/blocks-examples";
import blocksPackageJson from "./package.json" assert { type: "json" };

const blocksExamples =
  blocksPackageJson["dependencies"]["@githubnext/blocks-examples"];
const commitish = /#(.*)$/.exec(blocksExamples);
const tarball = /tarball\/(.*)$/.exec(blocksExamples);
const version =
  commitish?.[1] ||
  tarball?.[1] ||
  (() => {
    throw "couldn't find version of blocks-examples";
  })();
const packageJson = `https://raw.githubusercontent.com/${fullRepo}/${version}/package.json`;

async function init() {
  const packageJsonRawContent = await fetch(packageJson);
  const packageJsonContent = JSON.parse(packageJsonRawContent);
  const dependencies = {
    ...packageJsonContent.dependencies,
    ...packageJsonContent.devDependencies,
  };
  const localPackageJsonContent = JSON.parse(
    fs.readFileSync("./package.json", "utf8")
  );
  let optionalDependencies = { ...dependencies };
  const localDependencies = {
    ...localPackageJsonContent.dependencies,
    ...localPackageJsonContent.devDependencies,
  };
  for (const dependency in localDependencies) {
    delete optionalDependencies[dependency];
  }
  const unneededDependencies = ["vite", "esbuild"];
  for (const dependency of unneededDependencies) {
    delete optionalDependencies[dependency];
  }
  const newLocalPackageJsonContent = {
    ...localPackageJsonContent,
    optionalDependencies,
  };
  fs.writeFileSync(
    "./package.json",
    JSON.stringify(newLocalPackageJsonContent, null, 2) + "\n"
  );
}

init();

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve(body);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}
