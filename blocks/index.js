// All content in this /blocks folder is automatically generated
// in process-example-blocks.mjs, run during the `postinstall` npm script

import dynamic from "next/dynamic";

const codeBlock = dynamic(() => import("./file-blocks/code/index.tsx"), {ssr:false});
const excalidrawBlock = dynamic(() => import("./file-blocks/excalidraw.tsx"), {ssr:false});
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