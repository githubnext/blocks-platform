export function IFrameViewer({ contents }: { contents: string }) {
    return <div dangerouslySetInnerHTML={{ __html: contents }} />
}
