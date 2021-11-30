// All content in this /blocks folder is automatically generated
// in process-example-blocks.mjs, run during the `postinstall` npm script

import dynamic from "next/dynamic";

const codeBlock = dynamic(() => import("./file-blocks/code/index.tsx"), {ssr:false});
const excalidrawBlock = dynamic(() => import("./file-blocks/excalidraw.tsx"), {ssr:false});
const htmlBlock = dynamic(() => import("./file-blocks/html.tsx"), {ssr:false});
const cssBlock = dynamic(() => import("./file-blocks/css.tsx"), {ssr:false});
const DModelBlock = dynamic(() => import("./file-blocks/3d-files.tsx"), {ssr:false});
const flatBlock = dynamic(() => import("./file-blocks/flat.tsx"), {ssr:false});
const iframeBlock = dynamic(() => import("./file-blocks/iframe.tsx"), {ssr:false});
const simplePollBlock = dynamic(() => import("./file-blocks/poll.tsx"), {ssr:false});
const chartBlock = dynamic(() => import("./file-blocks/charts/index.tsx"), {ssr:false});
const simpleMarkdownBlock = dynamic(() => import("./file-blocks/simple-markdown/markdown.tsx"), {ssr:false});
const liveMarkdownBlock = dynamic(() => import("./file-blocks/live-markdown/index.tsx"), {ssr:false});
const reactFeedbackBlock = dynamic(() => import("./file-blocks/annotate-react/index.tsx"), {ssr:false});
const minimapBlock = dynamic(() => import("./folder-blocks/minimap/index.tsx"), {ssr:false});

export default {
  'code-block': codeBlock,
  'excalidraw-block': excalidrawBlock,
  'html-block': htmlBlock,
  'css-block': cssBlock,
  '3d-model-block': DModelBlock,
  'flat-block': flatBlock,
  'iframe-block': iframeBlock,
  'simple-poll-block': simplePollBlock,
  'chart-block': chartBlock,
  'simple-markdown-block': simpleMarkdownBlock,
  'live-markdown-block': liveMarkdownBlock,
  'react-feedback-block': reactFeedbackBlock,
  'minimap-block': minimapBlock
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
      ]
    },
    {
      "type": "file",
      "id": "excalidraw-block",
      "title": "Drawing block",
      "description": "A whiteboard tool",
      "entry": "/src/blocks/file-blocks/excalidraw.tsx",
      "extensions": [
        "excalidraw"
      ]
    },
    {
      "type": "file",
      "id": "html-block",
      "title": "HTML block",
      "description": "View HTML content",
      "entry": "/src/blocks/file-blocks/html.tsx",
      "extensions": [
        "html"
      ]
    },
    {
      "type": "file",
      "id": "css-block",
      "title": "CSS block",
      "description": "View selectors in a css file",
      "entry": "/src/blocks/file-blocks/css.tsx",
      "extensions": [
        "css"
      ]
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
      ]
    },
    {
      "type": "file",
      "id": "flat-block",
      "title": "Flat block",
      "description": "A block for flat data files",
      "entry": "/src/blocks/file-blocks/flat.tsx",
      "extensions": [
        "csv",
        "json"
      ]
    },
    {
      "type": "file",
      "id": "iframe-block",
      "title": "Iframe block",
      "description": "An iframe block",
      "entry": "/src/blocks/file-blocks/iframe.tsx",
      "extensions": [
        "iframe"
      ]
    },
    {
      "type": "file",
      "id": "simple-poll-block",
      "title": "Poll block",
      "description": "View simple polls beautifully",
      "entry": "/src/blocks/file-blocks/poll.tsx",
      "extensions": [
        "json"
      ]
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
      "example_file": "https://github.com/the-pudding/data/blob/master/pockets/measurements.csv"
    },
    {
      "type": "file",
      "id": "simple-markdown-block",
      "title": "Markdown block",
      "description": "A simple markdown block",
      "entry": "/src/blocks/file-blocks/simple-markdown/markdown.tsx",
      "extensions": [
        "md"
      ]
    },
    {
      "type": "file",
      "id": "live-markdown-block",
      "title": "Live Markdown",
      "description": "View rich markdown files",
      "entry": "/src/blocks/file-blocks/live-markdown/index.tsx",
      "extensions": [
        "md"
      ]
    },
    {
      "type": "file",
      "id": "react-feedback-block",
      "title": "React component feedback",
      "description": "Give feedback on a React component",
      "entry": "/src/blocks/file-blocks/annotate-react/index.tsx",
      "extensions": [
        "js",
        "jsx",
        "ts",
        "tsx"
      ]
    },
    {
      "type": "folder",
      "id": "minimap-block",
      "title": "Minimap",
      "description": "A visualization of your folders and files",
      "entry": "/src/blocks/folder-blocks/minimap/index.tsx"
    }
  ],
  "full_name": "githubnext/blocks-examples",
  "html_url": "https://github.com/githubnext/blocks-examples",
  "owner": "githubnext",
  "repo": "blocks-examples"
}