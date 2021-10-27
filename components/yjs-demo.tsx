import * as Y from "yjs";
import { useEffect, useRef, useState } from "react";
import {
  useYDoc,
  useYMap,
  StartAwarenessFunction,
  useYAwareness,
} from "zustand-yjs";
import { WebrtcProvider } from "y-webrtc";
import { useMount, useUpdateEffect } from "react-use";
import partition from "lodash/partition";
import sample from "lodash/sample";
import Excalidraw, {
  serializeAsJSON,
  getSceneVersion,
} from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";

import { useFileContent } from "hooks";

const colors = ["red", "orange", "blue", "green", "purple"];

const ID = +new Date();

type AwarenessState = {
  ID: number;
  color: string;
  elementIndex: number | null;
  pointer: any;
  button: any;
};

const connectMembers = (
  yDoc: Y.Doc,
  startAwareness: StartAwarenessFunction
) => {
  console.log("connect ", yDoc.guid);
  const provider = new WebrtcProvider(yDoc.guid, yDoc);

  provider.awareness.setLocalState({
    ID,
    color: sample(colors),
    elementIndex: null,
  });

  const stopAwareness = startAwareness(provider);

  return () => {
    console.log("disconnect", yDoc.guid);
    stopAwareness();
    provider.destroy();
  };
};

function CollaborativeFileEditor({
  content,
  docKey,
}: {
  content: string;
  docKey: string;
}) {
  const yDoc = useYDoc("root", connectMembers);
  const { set, data } = useYMap(yDoc.getMap("fileContents"));
  const actualContent = Buffer.from(content, "base64").toString();
  const excalidrawRef = useRef<ExcalidrawImperativeAPI>(null);
  const [version, setVersion] = useState<number | null>(null);

  useMount(() => {
    set(docKey, actualContent);
  });

  const [awarenessData, setAwareness] = useYAwareness<AwarenessState>(yDoc);

  const [[me], others] = partition(
    awarenessData,
    ({ ID: userId }) => userId === ID
  );

  const handlePointerUpdate = (payload: {
    pointer: {
      x: number;
      y: number;
    };
    button: "up" | "down";
    pointersMap: Map<
      number,
      Readonly<{
        x: number;
        y: number;
      }>
    >;
  }) => {
    setAwareness({ pointer: payload.pointer, button: payload.button });
  };

  useUpdateEffect(() => {
    if (!excalidrawRef.current) return;
    console.log(excalidrawRef.current.getAppState().selectedElementIds);

    const collaborators = others.reduce((map, next) => {
      map.set(next.ID, {
        pointer: next.pointer,
        button: next.button,
        selectedElementIds:
          excalidrawRef.current.getAppState().selectedElementIds,
        username: "",
        userState: undefined,
        color: {
          background: next.color,
        },
      });
      return map;
    }, new Map());
    if (!collaborators) return;
    // @ts-ignore
    excalidrawRef.current.updateScene({
      collaborators,
    });
  }, [others]);

  useEffect(() => {
    if (!version) return;
    if (!excalidrawRef.current) return;
    const serialized = serializeAsJSON(
      excalidrawRef.current.getSceneElements(),
      excalidrawRef.current.getAppState()
    );

    console.log(serialized);

    set(docKey, serialized);
  }, [version]);

  useEffect(() => {
    if (!data) return;
    if (!excalidrawRef.current) return;

    try {
      const parsed = JSON.parse(data[docKey] as string);
      excalidrawRef.current.updateScene({
        elements: parsed.elements,
        appState: parsed.appState,
      });
    } catch (e) {
      console.error(e);
    }
  }, [data]);

  if (!data || Object.keys(data).length === 0) return <div>Loading...</div>;

  return (
    <>
      <div className="p-4 flex items-center space-x-2 border-b">
        {me && (
          <img
            className="inline-block h-6 w-6 rounded-full"
            src="https://avatars.dicebear.com/api/pixel-art/me.svg"
            alt=""
          />
        )}
        {others.map((other, index) => {
          return (
            <img
              key={index}
              className="inline-block h-6 w-6 rounded-full"
              src={`https://avatars.dicebear.com/api/pixel-art/${other}-${
                index + 1
              }.svg`}
              alt=""
            />
          );
        })}
      </div>
      <div className="bg-gray-100 p-4 relative h-full">
        <Excalidraw
          initialData={JSON.parse(actualContent)}
          onPointerUpdate={handlePointerUpdate}
          onChange={(elements) => {
            const newVersion = getSceneVersion(elements);
            setVersion(newVersion);
          }}
          ref={excalidrawRef}
          isCollaborating
        />
      </div>
    </>
  );
}

const repo = `composable-github-test`;
const owner = `githubnext`;
const path = `test.excalidraw`;

export default function YJSDemo() {
  const { data, status } = useFileContent({
    repo,
    owner,
    path,
  });

  if (status === "loading") {
    return <div className="p-4 text-gray-600 text-sm">Loading file...</div>;
  }

  if (status === "success" && data) {
    return (
      <CollaborativeFileEditor
        docKey={`${owner}/${repo}/${path}`}
        content={data.content}
      />
    );
  }

  return null;
}
