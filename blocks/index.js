// All content in this /blocks folder is automatically generated
// in process-example-blocks.mjs, run during the `postinstall` npm script

import dynamic from "next/dynamic";

const codeBlock = dynamic(() => import("./file-blocks/code/index.tsx"), {ssr:false});
const excalidrawBlock = dynamic(() => import("./file-blocks/excalidraw/index.tsx"), {ssr:false});
const htmlBlock = dynamic(() => import("./file-blocks/html.tsx"), {ssr:false});
const cssBlock = dynamic(() => import("./file-blocks/css.tsx"), {ssr:false});
const imageBlock = dynamic(() => import("./file-blocks/image.tsx"), {ssr:false});
const jsonBlock = dynamic(() => import("./file-blocks/json.tsx"), {ssr:false});
const geojsonBlock = dynamic(() => import("./file-blocks/geojson.tsx"), {ssr:false});
const DModelBlock = dynamic(() => import("./file-blocks/3d-files.tsx"), {ssr:false});
const flatBlock = dynamic(() => import("./file-blocks/flat.tsx"), {ssr:false});
const simplePollBlock = dynamic(() => import("./file-blocks/poll.tsx"), {ssr:false});
const chartBlock = dynamic(() => import("./file-blocks/charts/index.tsx"), {ssr:false});
const markdownBlock = dynamic(() => import("./file-blocks/live-markdown/index.tsx"), {ssr:false});
const reactFeedbackBlock = dynamic(() => import("./file-blocks/annotate-react/index.tsx"), {ssr:false});
const sentenceEncoderBlock = dynamic(() => import("./file-blocks/sentence-encoder.tsx"), {ssr:false});
const processingBlock = dynamic(() => import("./file-blocks/processing.tsx"), {ssr:false});
const summarizeBlock = dynamic(() => import("./file-blocks/summarize/index.tsx"), {ssr:false});
const explainBlock = dynamic(() => import("./file-blocks/explain/index.tsx"), {ssr:false});
const editBlock = dynamic(() => import("./file-blocks/edit/index.tsx"), {ssr:false});
const minimapBlock = dynamic(() => import("./folder-blocks/minimap/index.tsx"), {ssr:false});
const overviewBlock = dynamic(() => import("./folder-blocks/overview/index.tsx"), {ssr:false});
const dashboardBlock = dynamic(() => import("./folder-blocks/dashboard/index.tsx"), {ssr:false});
const codeTourBlock = dynamic(() => import("./folder-blocks/code-tour/index.tsx"), {ssr:false});
const infiniteCanvasBlock = dynamic(() => import("./folder-blocks/infinite-canvas/index.tsx"), {ssr:false});

export default {
  'code-block': codeBlock,
  'excalidraw-block': excalidrawBlock,
  'html-block': htmlBlock,
  'css-block': cssBlock,
  'image-block': imageBlock,
  'json-block': jsonBlock,
  'geojson-block': geojsonBlock,
  '3d-model-block': DModelBlock,
  'flat-block': flatBlock,
  'simple-poll-block': simplePollBlock,
  'chart-block': chartBlock,
  'markdown-block': markdownBlock,
  'react-feedback-block': reactFeedbackBlock,
  'sentence-encoder-block': sentenceEncoderBlock,
  'processing-block': processingBlock,
  'summarize-block': summarizeBlock,
  'explain-block': explainBlock,
  'edit-block': editBlock,
  'minimap-block': minimapBlock,
  'overview-block': overviewBlock,
  'dashboard-block': dashboardBlock,
  'code-tour-block': codeTourBlock,
  'infinite-canvas-block': infiniteCanvasBlock
}

export const defaultBlocksRepo = {
  "blocks": [
    {
      "type": "file",
      "id": "code-block",
      "title": "Code block",
      "description": "A basic code block",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/code/index.tsx",
      "extensions": [
        "*"
      ],
      "matches": [
        "*"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/Aside.jsx"
    },
    {
      "type": "file",
      "id": "excalidraw-block",
      "title": "Drawing block",
      "description": "A whiteboard tool",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/excalidraw/index.tsx",
      "extensions": [
        "excalidraw"
      ],
      "matches": [
        "*.excalidraw"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/drawing.excalidraw"
    },
    {
      "type": "file",
      "id": "html-block",
      "title": "HTML block",
      "description": "View HTML content",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/html.tsx",
      "extensions": [
        "html",
        "svelte"
      ],
      "matches": [
        "*.html",
        "*.svelte"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/photos.html"
    },
    {
      "type": "file",
      "id": "css-block",
      "title": "Styleguide block",
      "description": "View selectors in a css file",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/css.tsx",
      "extensions": [
        "css"
      ],
      "matches": [
        "*.css"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/global.css"
    },
    {
      "type": "file",
      "id": "image-block",
      "title": "Image block",
      "description": "View images",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/image.tsx",
      "extensions": [
        "png",
        "jpg",
        "jpeg",
        "gif",
        "svg"
      ],
      "matches": [
        "*.png",
        "*.jpg",
        "*.jpeg",
        "*.gif",
        "*.svg"
      ],
      "example_path": "https://github.com/pmndrs/react-spring/blob/HEAD/assets/projects/aragon.png?raw=true"
    },
    {
      "type": "file",
      "id": "json-block",
      "title": "Object explorer",
      "description": "An interactive view of JSON objects",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/json.tsx",
      "extensions": [
        "json",
        "webmanifest",
        "prettierrc",
        "yaml",
        "yml"
      ],
      "matches": [
        "*.json",
        "*.webmanifest",
        "webmanifest",
        "prettierrc",
        "*.prettierrc",
        "*.yaml",
        "*.yml"
      ],
      "example_path": "https://github.com/d3/d3-geo/blob/main/package.json"
    },
    {
      "type": "file",
      "id": "geojson-block",
      "title": "GeoJSON explorer",
      "description": "View & edit GeoJSON data",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/geojson.tsx",
      "extensions": [
        "json",
        "geojson"
      ],
      "matches": [
        "*.geo.json",
        "*.geojson"
      ],
      "example_path": "https://github.com/d3/d3-geo/blob/main/package.json"
    },
    {
      "type": "file",
      "id": "3d-model-block",
      "title": "3D block",
      "description": "A block for 3d files",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/3d-files.tsx",
      "extensions": [
        "gltf",
        "glb"
      ],
      "matches": [
        "*.gltf",
        "*.glb"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/avocado.glb"
    },
    {
      "type": "file",
      "id": "flat-block",
      "title": "Flat data block",
      "description": "A block for flat data files",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/flat.tsx",
      "extensions": [
        "csv"
      ],
      "matches": [
        "*.csv"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/data.csv"
    },
    {
      "type": "file",
      "id": "simple-poll-block",
      "title": "Poll block",
      "description": "View simple polls beautifully",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/poll.tsx",
      "extensions": [
        "json"
      ],
      "matches": [
        "*.json"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/poll.json"
    },
    {
      "type": "file",
      "id": "chart-block",
      "title": "Chart block",
      "description": "An interactive chart block",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/charts/index.tsx",
      "extensions": [
        "csv"
      ],
      "matches": [
        "*.csv"
      ],
      "example_path": "https://github.com/the-pudding/data/blob/master/pockets/measurements.csv"
    },
    {
      "type": "file",
      "id": "markdown-block",
      "title": "Markdown",
      "description": "View markdown files. You can also view live repo info, using Issues, Releases, and Commits custom components, as well as live code examples with CodeSandbox.",
      "sandbox": true,
      "entry": "/src/blocks/file-blocks/live-markdown/index.tsx",
      "extensions": [
        "md",
        "mdx"
      ],
      "matches": [
        "*.md",
        "*.mdx"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/README.md"
    },
    {
      "type": "file",
      "id": "react-feedback-block",
      "title": "React component feedback",
      "description": "Give feedback on a React component",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/annotate-react/index.tsx",
      "extensions": [
        "jsx",
        "tsx"
      ],
      "matches": [
        "*.jsx",
        "*.tsx"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/Aside.jsx"
    },
    {
      "type": "file",
      "id": "sentence-encoder-block",
      "title": "Sentence encoder block",
      "description": "Experiment with your sentence-encoder",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/sentence-encoder.tsx",
      "extensions": [
        "json"
      ],
      "matches": [
        "*.json"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/queries.json"
    },
    {
      "type": "file",
      "id": "processing-block",
      "title": "Processing block",
      "description": "Run your p5.js sketches",
      "sandbox": true,
      "entry": "/src/blocks/file-blocks/processing.tsx",
      "extensions": [
        "js"
      ],
      "matches": [
        "*.js"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/processing-sketch.js"
    },
    {
      "type": "file",
      "id": "summarize-block",
      "title": "Summarize block",
      "description": "Summarize parts of a file using ML",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/summarize/index.tsx",
      "extensions": [
        "js",
        "ts",
        "tsx",
        "jsx"
      ],
      "matches": [
        "*.js",
        "*.ts",
        "*.tsx",
        "*.jsx"
      ],
      "example_path": "https://github.com/mattdesl/canvas-sketch/blob/master/lib/save.js"
    },
    {
      "type": "file",
      "id": "explain-block",
      "title": "Explain block",
      "description": "Explain parts of a file using ML",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/explain/index.tsx",
      "extensions": [
        "js",
        "ts",
        "tsx",
        "jsx",
        "rb",
        "py"
      ],
      "matches": [
        "*.js",
        "*.ts",
        "*.tsx",
        "*.jsx",
        "*.rb",
        "*.py"
      ],
      "example_path": "https://github.com/mattdesl/canvas-sketch/blob/master/lib/save.js"
    },
    {
      "type": "file",
      "id": "edit-block",
      "title": "Edit code",
      "description": "Edit code by prompting a Machine Learning model",
      "sandbox": false,
      "entry": "/src/blocks/file-blocks/edit/index.tsx",
      "extensions": [
        "*"
      ],
      "matches": [
        "*"
      ],
      "example_path": "https://github.com/githubnext/blocks-tutorial/blob/main/processing-sketch.js"
    },
    {
      "type": "folder",
      "id": "minimap-block",
      "title": "Minimap",
      "description": "A visualization of your folders and files",
      "sandbox": false,
      "entry": "/src/blocks/folder-blocks/minimap/index.tsx",
      "example_path": "https://github.com/githubnext/blocks-tutorial"
    },
    {
      "type": "folder",
      "id": "overview-block",
      "title": "Overview",
      "description": "An overview of a folder: including README, license, and recent activity",
      "sandbox": false,
      "entry": "/src/blocks/folder-blocks/overview/index.tsx",
      "example_path": "https://github.com/githubnext/blocks-tutorial"
    },
    {
      "type": "folder",
      "id": "dashboard-block",
      "title": "Dashboard",
      "description": "A dashboard of Blocks",
      "sandbox": false,
      "entry": "/src/blocks/folder-blocks/dashboard/index.tsx",
      "example_path": "https://github.com/githubnext/blocks-tutorial"
    },
    {
      "type": "folder",
      "id": "code-tour-block",
      "title": "Code Tour",
      "description": "Create documented tours of your code",
      "sandbox": false,
      "entry": "/src/blocks/folder-blocks/code-tour/index.tsx",
      "example_path": "https://github.com/githubnext/blocks-tutorial"
    },
    {
      "type": "folder",
      "id": "infinite-canvas-block",
      "title": "Infinite Canvas",
      "description": "View and annotate your files in an infinite canvas",
      "sandbox": false,
      "entry": "/src/blocks/folder-blocks/infinite-canvas/index.tsx",
      "example_path": "https://github.com/githubnext/blocks-tutorial"
    }
  ],
  "full_name": "githubnext/blocks-examples",
  "html_url": "https://github.com/githubnext/blocks-examples",
  "owner": "githubnext",
  "repo": "blocks-examples"
}