// All content in this /blocks folder is automatically generated
// in process-example-blocks.mjs, run during the `postinstall` npm script

import dynamic from "next/dynamic";

const codeBlock = dynamic(() => import("./file-blocks/code/index.tsx"), {ssr:false});
const excalidrawBlock = dynamic(() => import("./file-blocks/excalidraw.tsx"), {ssr:false});
const htmlBlock = dynamic(() => import("./file-blocks/html.tsx"), {ssr:false});
const cssBlock = dynamic(() => import("./file-blocks/css.tsx"), {ssr:false});
const imageBlock = dynamic(() => import("./file-blocks/image.tsx"), {ssr:false});
const jsonBlock = dynamic(() => import("./file-blocks/json.tsx"), {ssr:false});
const DModelBlock = dynamic(() => import("./file-blocks/3d-files.tsx"), {ssr:false});
const flatBlock = dynamic(() => import("./file-blocks/flat.tsx"), {ssr:false});
const simplePollBlock = dynamic(() => import("./file-blocks/poll.tsx"), {ssr:false});
const chartBlock = dynamic(() => import("./file-blocks/charts/index.tsx"), {ssr:false});
const markdownBlock = dynamic(() => import("./file-blocks/live-markdown/index.tsx"), {ssr:false});
const reactFeedbackBlock = dynamic(() => import("./file-blocks/annotate-react/index.tsx"), {ssr:false});
const processing = dynamic(() => import("./file-blocks/processing.tsx"), {ssr:false});
const sentenceEncoder = dynamic(() => import("./file-blocks/sentence-encoder.tsx"), {ssr:false});
const homepage = dynamic(() => import("./folder-blocks/homepage/index.tsx"), {ssr:false});
const minimapBlock = dynamic(() => import("./folder-blocks/minimap/index.tsx"), {ssr:false});
const dashboardBlock = dynamic(() => import("./folder-blocks/dashboard/index.tsx"), {ssr:false});
const codeTourBlock = dynamic(() => import("./folder-blocks/code-tour/index.tsx"), {ssr:false});

export default {
  'code-block': codeBlock,
  'excalidraw-block': excalidrawBlock,
  'html-block': htmlBlock,
  'css-block': cssBlock,
  'image-block': imageBlock,
  'json-block': jsonBlock,
  '3d-model-block': DModelBlock,
  'flat-block': flatBlock,
  'simple-poll-block': simplePollBlock,
  'chart-block': chartBlock,
  'markdown-block': markdownBlock,
  'react-feedback-block': reactFeedbackBlock,
  'processing': processing,
  'sentence-encoder': sentenceEncoder,
  'homepage': homepage,
  'minimap-block': minimapBlock,
  'dashboard-block': dashboardBlock,
  'code-tour-block': codeTourBlock
}

export const defaultBlocksRepo = {
  "blocks": [
    {
      "type": "file",
      "id": "code-block",
      "title": "Code block",
      "description": "A basic code block",
      "entry": "/src/blocks/file-blocks/code/index.tsx",
      "extensions": [
        "*"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/Aside.jsx"
    },
    {
      "type": "file",
      "id": "excalidraw-block",
      "title": "Drawing block",
      "description": "A whiteboard tool",
      "entry": "/src/blocks/file-blocks/excalidraw.tsx",
      "extensions": [
        "excalidraw"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/drawing.excalidraw"
    },
    {
      "type": "file",
      "id": "html-block",
      "title": "HTML block",
      "description": "View HTML content",
      "entry": "/src/blocks/file-blocks/html.tsx",
      "extensions": [
        "html",
        "svelte"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/photos.html"
    },
    {
      "type": "file",
      "id": "css-block",
      "title": "CSS block",
      "description": "View selectors in a css file",
      "entry": "/src/blocks/file-blocks/css.tsx",
      "extensions": [
        "css"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/global.css"
    },
    {
      "type": "file",
      "id": "image-block",
      "title": "Image block",
      "description": "View images",
      "entry": "/src/blocks/file-blocks/image.tsx",
      "extensions": [
        "png",
        "jpg",
        "jpeg",
        "gif",
        "svg"
      ],
      "example_path": "https://github.com/pmndrs/react-spring/blob/HEAD/assets/projects/aragon.png?raw=true"
    },
    {
      "type": "file",
      "id": "json-block",
      "title": "Object explorer",
      "description": "An interactive view of JSON objects",
      "entry": "/src/blocks/file-blocks/json.tsx",
      "extensions": [
        "json",
        "webmanifest",
        "prettierrc",
        "yaml",
        "yml"
      ],
      "example_path": "https://github.com/d3/d3-geo/blob/main/package.json"
    },
    {
      "type": "file",
      "id": "3d-model-block",
      "title": "3D block",
      "description": "A block for 3d files",
      "entry": "/src/blocks/file-blocks/3d-files.tsx",
      "extensions": [
        "gltf",
        "glb"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/avocado.glb"
    },
    {
      "type": "file",
      "id": "flat-block",
      "title": "Flat data block",
      "description": "A block for flat data files",
      "entry": "/src/blocks/file-blocks/flat.tsx",
      "extensions": [
        "csv"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/data.csv"
    },
    {
      "type": "file",
      "id": "simple-poll-block",
      "title": "Poll block",
      "description": "View simple polls beautifully",
      "entry": "/src/blocks/file-blocks/poll.tsx",
      "extensions": [
        "json"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/poll.json"
    },
    {
      "type": "file",
      "id": "chart-block",
      "title": "Chart block",
      "description": "An interactive chart block",
      "entry": "/src/blocks/file-blocks/charts/index.tsx",
      "extensions": [
        "csv"
      ],
      "example_path": "https://github.com/the-pudding/data/blob/master/pockets/measurements.csv"
    },
    {
      "type": "file",
      "id": "markdown-block",
      "title": "Markdown",
      "description": "View markdown files. You can also view live repo into, using Issues, Releases, and Commits custom components, as well as live code examples with CodeSandbox.",
      "entry": "/src/blocks/file-blocks/live-markdown/index.tsx",
      "extensions": [
        "md",
        "mdx"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/README.md"
    },
    {
      "type": "file",
      "id": "react-feedback-block",
      "title": "React component feedback",
      "description": "Give feedback on a React component",
      "entry": "/src/blocks/file-blocks/annotate-react/index.tsx",
      "extensions": [
        "jsx",
        "tsx"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/Aside.jsx"
    },
    {
      "type": "file",
      "id": "processing",
      "title": "Processing sketch viewer",
      "description": "View your p5.js sketches",
      "entry": "/src/blocks/file-blocks/processing.tsx",
      "extensions": [
        "js"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/processing-sketch.js"
    },
    {
      "type": "file",
      "id": "sentence-encoder",
      "title": "Sentence encoder",
      "description": "Experiment with your sentence-encoder",
      "entry": "/src/blocks/file-blocks/sentence-encoder.tsx",
      "extensions": [
        "json"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/queries.json"
    },
    {
      "type": "folder",
      "id": "homepage",
      "title": "Homepage",
      "description": "The homepage of your repo",
      "entry": "/src/blocks/folder-blocks/homepage/index.tsx",
      "example_path": "https://github.com/wattenberger/kumiko"
    },
    {
      "type": "folder",
      "id": "minimap-block",
      "title": "Minimap",
      "description": "A visualization of your folders and files",
      "entry": "/src/blocks/folder-blocks/minimap/index.tsx",
      "example_path": "https://github.com/githubnext/blocks-tutorial"
    },
    {
      "type": "folder",
      "id": "dashboard-block",
      "title": "Dashboard",
      "description": "A dashboard of Blocks",
      "entry": "/src/blocks/folder-blocks/dashboard/index.tsx",
      "example_path": "https://github.com/githubnext/blocks-tutorial"
    },
    {
      "type": "folder",
      "id": "code-tour-block",
      "title": "Code Tour",
      "description": "Create documented tours of your code",
      "entry": "/src/blocks/folder-blocks/code-tour/index.tsx",
      "example_path": "https://github.com/githubnext/blocks-tutorial"
    }
  ],
  "full_name": "githubnext/blocks-examples",
  "html_url": "https://github.com/githubnext/blocks-examples",
  "owner": "githubnext",
  "repo": "blocks-examples"
}