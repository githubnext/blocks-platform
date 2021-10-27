import dynamic from "next/dynamic";
const YJSDemo = dynamic(() => import("components/yjs-demo"), { ssr: false });

export default function Sandbox() {
  return <YJSDemo />;
}
