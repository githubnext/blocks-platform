import * as Immer from "immer";
import type { RepoFiles } from "@githubnext/utils";
import { useFileContent, useCallbackWithProps } from "hooks";
import type { Context, UpdatedContents } from "./index";
import { GeneralBlock } from "../general-block";

type BlockPaneBlockProps = {
  token: string;
  block: Block;
  fileInfo: RepoFiles[0];
  path: string;
  context: Context;
  isFolder: boolean;
  theme: string;
  branchName: string;
  updatedContents: UpdatedContents;
  setUpdatedContents: (_: UpdatedContents) => void;
};

export default function BlockPaneBlock({
  token,
  block,
  fileInfo,
  path,
  context,
  isFolder,
  theme,
  branchName,
  updatedContents,
  setUpdatedContents,
}: BlockPaneBlockProps) {
  const size = fileInfo.size || 0;
  const fileSizeLimit = 1500000; // 1.5Mb
  const isTooLarge = size > fileSizeLimit;

  const showUpdatedContents =
    updatedContents[path] && context.sha === branchName;

  const { data: fileData } = useFileContent(
    {
      repo: context.repo,
      owner: context.owner,
      path: path,
      fileRef: context.sha,
    },
    {
      enabled: !isFolder && !showUpdatedContents && !isTooLarge,
      cacheTime: 0,
    }
  );

  const onRequestUpdateContent = useCallbackWithProps(
    ({
        path,
        context,
        updatedContents,
        setUpdatedContents,
        showUpdatedContents,
        fileData,
      }) =>
      (newContent: string) => {
        if (showUpdatedContents) {
          setUpdatedContents(
            Immer.produce(updatedContents, (updatedContents) => {
              if (newContent === updatedContents[path].original) {
                delete updatedContents[path];
              } else {
                updatedContents[path].content = newContent;
              }
            })
          );
        } else if (fileData) {
          if (context.sha === branchName) {
            setUpdatedContents(
              Immer.produce(updatedContents, (updatedContents) => {
                if (newContent !== fileData.content) {
                  updatedContents[path] = {
                    sha: fileData.context.sha,
                    original: fileData.content,
                    content: newContent,
                  };
                }
              })
            );
          }
        }
      },
    {
      path,
      context,
      updatedContents,
      setUpdatedContents,
      showUpdatedContents,
      fileData,
    }
  );

  let content: string = "";
  if (showUpdatedContents) {
    content = updatedContents[path].content;
  } else if (fileData) {
    content = fileData.content;
  }

  if (isTooLarge)
    return (
      <div className="italic p-4 pt-40 text-center mx-auto text-gray-600">
        Oh boy, that's a honkin file! It's {size / 1000} KBs.
      </div>
    );

  return (
    <GeneralBlock
      key={block.id}
      // @ts-ignore
      context={context}
      theme={theme || "light"}
      block={block}
      token={token}
      branchName={branchName}
      content={content}
      onRequestUpdateContent={onRequestUpdateContent}
    />
  );
}
