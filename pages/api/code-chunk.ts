import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import TypeScript from "tree-sitter-typescript";
import flatten from "lodash/flatten";

// break code into meaningful "chunks"
export default async function getChunks(req, res) {
  const { code, language } = req.body;

  const parser = new Parser();
  parser.setLanguage(languagesMap[language] || JavaScript);

  const tree = parser.parse(code);

  const structure = breakIntoChunks(tree.rootNode);

  res.status(200).json({
    structure,
  });
}

const languagesMap = {
  JavaScript: JavaScript,
  TypeScript: TypeScript,
};

const maxChunkLength = 1200;
const breakIntoChunks = (node) => {
  const functionTypes = [
    "function",
    "class",
    "function_declaration",
    "jsx_element",
  ];
  const functionsStructure = node
    .descendantsOfType(functionTypes)
    .map((node) => {
      const text = node.text;
      if (text.length > maxChunkLength) {
        return node.namedChildren.map(breakIntoChunks);
      }

      // take out short ones
      if (text.length < 40) return null;
      const position = [node.startIndex, node.endIndex];
      const name =
        node.namedChildren[0]?.nameNode?.text || node.namedChildren[0]?.text;
      return [
        {
          type: "function",
          position,
          name,
        },
      ];
    });

  const maybeFunctionTypes = ["lexical_declaration", "module"];
  const maybeFunctionsStructure = node
    .descendantsOfType(maybeFunctionTypes)
    .map((node) => {
      const child = node.namedChildren[0];
      const childType = child.type;
      if (![...functionTypes, "variable_declarator"].includes(childType))
        return null;
      const text = node.text;
      if (text.length > maxChunkLength) {
        return node.namedChildren.map(breakIntoChunks);
      }
      // take out short ones
      if (text.length < 40) return null;
      const position = [node.startIndex, node.endIndex];
      const name =
        node.namedChildren[0]?.nameNode?.text ||
        node.namedChildren[0]?.nameNode?.namedChildren[0]?.text;
      return [
        {
          type: "function",
          position,
          name,
        },
      ];
    });

  return flatten([...functionsStructure, ...maybeFunctionsStructure]).filter(
    Boolean
  );
};
