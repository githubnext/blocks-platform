import * as Y from "yjs";
import { useState, useMemo, useEffect } from "react";
import {
  useYDoc,
  useYArray,
  useYMap,
  StartAwarenessFunction,
  useYAwareness,
} from "zustand-yjs";
import { WebrtcProvider } from "y-webrtc";
import { useMount } from "react-use";
import { useFileContent } from "hooks";
import partition from "lodash/partition";
import sample from "lodash/sample";

const colors = ["red", "orange", "blue", "green", "purple"];

const ID = +new Date();

type AwarenessState = {
  ID: number;
  color: string;
  elementIndex: number | null;
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

  useMount(() => {
    set(docKey, actualContent);
  });

  const [awarenessData] = useYAwareness<AwarenessState>(yDoc);

  const [[me], others] = partition(
    awarenessData,
    ({ ID: userId }) => userId === ID
  );

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
              className="inline-block h-6 w-6 rounded-full"
              src={`https://avatars.dicebear.com/api/pixel-art/${other}-${
                index + 1
              }.svg`}
              alt=""
            />
          );
        })}
      </div>
      <div className="bg-gray-100 p-4 relative">
        <textarea
          className="w-full border border-gray-200 rounded p-4 font-mono"
          cols={20}
          rows={20}
          onChange={(e) => {
            set(docKey, e.target.value);
          }}
          value={data[docKey] as string}
        ></textarea>
      </div>
    </>
  );
}

export default function YJSDemo() {
  const { data, status } = useFileContent({
    repo: "react-overflow-list",
    owner: "mattrothenberg",
    path: "package.json",
  });

  if (status === "loading") {
    return <div className="p-4 text-gray-600 text-sm">Loading file...</div>;
  }

  if (status === "success" && data) {
    return (
      <CollaborativeFileEditor
        docKey="mattrothenberg/react-overflow-list/package.json"
        content={data.content}
      />
    );
  }

  return null;
}
