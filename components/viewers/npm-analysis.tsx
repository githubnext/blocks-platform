import { ViewerProps } from ".";

const makeUrl = (packageName: string) =>
  `https://npmgraph.js.org/?q=${packageName}`;

export function NpmAnalysisViewer(props: ViewerProps) {
  const asJson = JSON.parse(props.contents);

  return (
    <div className="flex-1 h-full">
      <iframe className="h-full w-full" src={makeUrl(asJson.name)} />
    </div>
  );
}
