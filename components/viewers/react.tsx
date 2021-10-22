import { useView, Compiler, Editor, Error } from 'react-view';
import { ViewerProps } from '.';

export default function ReactViewer({ contents, meta }: ViewerProps) {
  const { name } = meta
  const componentName = name.split("/").pop().split(".")[0]

  const wrappedContents = `
() => {
  ${contents.replaceAll("export ", "")}

  return (
    <${componentName}>
      Text
    </${componentName}>
  )
}`

  const params = useView({
    initialCode: wrappedContents,
    scope: {},
    onUpdate: console.log,
  });

  return (
    <>
      <Compiler {...params.compilerProps} />
      <Editor {...params.editorProps} language="jsx" />
      <Error {...params.errorProps} />
    </>
  );
}
