import fse from "fs-extra";
import _ from "lodash";

const moduleLocation = "./node_modules/@githubnext/blocks-examples"
const blocksLocation = moduleLocation + "/src/blocks"
const packageJsonLocation = moduleLocation + "/package.json"
const newLocation = "./blocks"
const indexFile = newLocation + "/index.js"

async function init() {
  await fse.emptyDir(newLocation)
  await fse.copySync(blocksLocation, newLocation, {
    overwrite: true,
  }, (err) => {
    if (err) {
      console.error(err)
    }
  })
  const blocksPackageJsonContents = await fse.readFile(packageJsonLocation, "utf8")
  const blocksPackageJson = JSON.parse(blocksPackageJsonContents)
  const blocks = blocksPackageJson.blocks
  await createIndexFile(blocks)
  await processFiles(blocks)
}

init();

async function createIndexFile(blocks) {
  let blocksObject = {}
  let indexContents = `// All content in this /blocks folder is automatically generated
// in process-example-blocks.mjs, run during the \`postinstall\` npm script\n\n`
  indexContents += `import dynamic from "next/dynamic";\n\n`
  blocks.forEach(block => {
    blocksObject[`'${block.id}'`] = convertIdToVariableName(block.id)
    const blockPath = block.entry.split("/").slice(3).join("/")
    indexContents += `const ${convertIdToVariableName(block.id)} = dynamic(() => import("./${blockPath}"), {ssr:false});\n`
  })
  indexContents += `\n`
  indexContents += `export default ${JSON.stringify(blocksObject, null, 2).replace(/\"/g, "")
    }`

  indexContents += `\n\n`
  indexContents += `export const defaultBlocksRepo = ${JSON.stringify({
    blocks,
    full_name: "githubnext/blocks-examples",
    html_url: "https://github.com/githubnext/blocks-examples",
    owner: "githubnext",
    repo: "blocks-examples",
  }, null, 2)}`
  await fse.writeFile(indexFile, indexContents)
}

function convertIdToVariableName(id) {
  return _.camelCase(id)
    .replace(/^\d/, "")
}

function getRecursiveFiles(path) {
  const files = fse.readdirSync(path)
  const filesRecursive = files.map(file => {
    const filePath = path + "/" + file
    if (fse.lstatSync(filePath).isDirectory()) {
      return getRecursiveFiles(filePath)
    } else {
      return filePath
    }
  })
  return _.flatten(filesRecursive)
}

const mainCssFile = "./blocks/blocks.css"
async function processFiles(blocks) {
  const files = getRecursiveFiles(newLocation)
  let cssFileContents = ""
  files.forEach(async (file) => {
    const extension = file.split(".").pop()
    if (extension === "css") {
      // import into our main css file
      cssFileContents += `@import url(".${file.slice(8)}");\n`
      const block = blocks.find(block => block.entry.includes(file.split("/").slice(1, 4).join("/")))
      if (!block) console.log("No block found for", file.split("/").slice(1, 4).join("/"))
      await processCssFile(file, block?.id)
    } else if (["js", "ts", "jsx", "tsx"].includes(extension)) {
      await processJsFile(file)

    }
  })
  await fse.writeFile(mainCssFile, cssFileContents)
}

async function processCssFile(file, blockId) {
  // scope to the specific block
  const contents = await fse.readFile(file, "utf8")
  const rulePrefix = `#example-block-${blockId}`
  const newContents = contents
    .replace(/^\./g, `\n${rulePrefix} .`)
    .replace(/\n\./g, `\n${rulePrefix} .`)
  await fse.writeFile(file, newContents)
}

async function processJsFile(file) {
  // comment out .css imports
  const contents = await fse.readFile(file, "utf8")
  const newContents = contents.replace(/import.+(\.css)/g, "// import './$1'")
  await fse.writeFile(file, newContents)
}