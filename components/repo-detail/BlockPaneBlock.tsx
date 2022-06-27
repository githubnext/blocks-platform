import React from "react";
import type { Block } from "@githubnext/blocks";
import type { Context } from "./index";

type BlockPaneBlockProps = {
  block: Block;
  context: Context;
};

export default function BlockPaneBlock({
  block,
  context,
}: BlockPaneBlockProps) {
  /*
  if (isTooLarge)
    return (
      <div className="italic p-4 pt-40 text-center mx-auto text-gray-600">
        Oh boy, that's a honkin file! It's {size / 1000} KBs.
      </div>
    );
  */

  return (
    <div
      className="flex flex-col"
      style={{
        height: "calc(100% - 3.3em)",
      }}
    >
      <div className="overflow-y-auto flex-1">
        <iframe
          key={block.id}
          className={"w-full h-full"}
          sandbox={"allow-scripts allow-same-origin allow-forms"}
          src={`${process.env.NEXT_PUBLIC_SANDBOX_DOMAIN}#${encodeURIComponent(
            JSON.stringify({ block, context })
          )}`}
        />
      </div>
    </div>
  );
}
