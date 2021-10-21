export const langMap = [
  {
    extensions: [],
    language: "abap",
  },
  {
    extensions: [],
    language: "aes",
  },
  {
    extensions: [],
    language: "apex",
  },
  {
    extensions: [],
    language: "azcli",
  },
  {
    extensions: [],
    language: "bat",
  },
  {
    extensions: [],
    language: "bicep",
  },
  {
    extensions: [],
    language: "c",
  },
  {
    extensions: [],
    language: "cameligo",
  },
  {
    extensions: [],
    language: "clojure",
  },
  {
    extensions: [],
    language: "coffeescript",
  },
  {
    extensions: [],
    language: "cpp",
  },
  {
    extensions: [],
    language: "csharp",
  },
  {
    extensions: [],
    language: "csp",
  },
  {
    extensions: ["css", "scss", "less", "sass"],
    language: "css",
  },
  {
    extensions: [],
    language: "dart",
  },
  {
    extensions: [],
    language: "dockerfile",
  },
  {
    extensions: [],
    language: "ecl",
  },
  {
    extensions: [],
    language: "elixir",
  },
  {
    extensions: [],
    language: "fsharp",
  },
  {
    extensions: [],
    language: "go",
  },
  {
    extensions: [],
    language: "graphql",
  },
  {
    extensions: [],
    language: "handlebars",
  },
  {
    extensions: [],
    language: "hcl",
  },
  {
    extensions: ["htm", "html"],
    language: "html",
  },
  {
    extensions: [],
    language: "ini",
  },
  {
    extensions: [],
    language: "java",
  },
  {
    extensions: ["js", "jsx", "es"],
    language: "javascript",
  },
  {
    extensions: ["json", "prettierrc"],
    language: "json",
  },
  {
    extensions: [],
    language: "julia",
  },
  {
    extensions: [],
    language: "kotlin",
  },
  {
    extensions: [],
    language: "less",
  },
  {
    extensions: [],
    language: "lexon",
  },
  {
    extensions: [],
    language: "liquid",
  },
  {
    extensions: [],
    language: "lua",
  },
  {
    extensions: [],
    language: "m3",
  },
  {
    extensions: ["md", "mdx", "markdown"],
    language: "markdown",
  },
  {
    extensions: [],
    language: "mips",
  },
  {
    extensions: [],
    language: "msdax",
  },
  {
    extensions: [],
    language: "mysql",
  },
  {
    extensions: [],
    language: "objective-c",
  },
  {
    extensions: [],
    language: "pascal",
  },
  {
    extensions: [],
    language: "pascaligo",
  },
  {
    extensions: [],
    language: "perl",
  },
  {
    extensions: [],
    language: "pgsql",
  },
  {
    extensions: ["php"],
    language: "php",
  },
  {
    extensions: [],
    language: "plaintext",
  },
  {
    extensions: [],
    language: "postiats",
  },
  {
    extensions: [],
    language: "powerquery",
  },
  {
    extensions: [],
    language: "powershell",
  },
  {
    extensions: [],
    language: "pug",
  },
  {
    extensions: [],
    language: "python",
  },
  {
    extensions: [],
    language: "qsharp",
  },
  {
    extensions: [],
    language: "r",
  },
  {
    extensions: [],
    language: "razor",
  },
  {
    extensions: [],
    language: "redis",
  },
  {
    extensions: [],
    language: "redshift",
  },
  {
    extensions: [],
    language: "restructuredtext",
  },
  {
    extensions: [],
    language: "ruby",
  },
  {
    extensions: [],
    language: "rust",
  },
  {
    extensions: [],
    language: "sb",
  },
  {
    extensions: [],
    language: "scala",
  },
  {
    extensions: [],
    language: "scheme",
  },
  {
    extensions: [],
    language: "scss",
  },
  {
    extensions: [],
    language: "shell",
  },
  {
    extensions: [],
    language: "sol",
  },
  {
    extensions: [],
    language: "sparql",
  },
  {
    extensions: [],
    language: "sql",
  },
  {
    extensions: [],
    language: "st",
  },
  {
    extensions: [],
    language: "swift",
  },
  {
    extensions: [],
    language: "systemverilog",
  },
  {
    extensions: [],
    language: "tcl",
  },
  {
    extensions: [],
    language: "twig",
  },
  {
    extensions: ["ts", "tsx"],
    language: "typescript",
  },
  {
    extensions: [],
    language: "vb",
  },
  {
    extensions: [],
    language: "verilog",
  },
  {
    extensions: [],
    language: "xml",
  },
  {
    extensions: ["yaml", "yml"],
    language: "yaml",
  },
];

export function getLanguageFromFilename(filename) {
  if (!filename) return "";
  const extension = filename.split(".").slice(-1)[0];

  const match = langMap.find((mapping) =>
    mapping.extensions.includes(extension)
  );

  if (match) {
    return match.language;
  } else {
    return "";
  }
}
