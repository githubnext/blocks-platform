import * as Immer from "immer";
import { useContext } from "react";
import type { RepoFiles } from "@githubnext/blocks";
import { useFileContent, useCallbackWithProps } from "hooks";
import { AppContext } from "context";
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
  const appContext = useContext(AppContext);

  const size = fileInfo.size || 0;
  const fileSizeLimit = 1500000; // 1.5Mb
  const isTooLarge = size > fileSizeLimit;

  const onBranchTip = context.sha === branchName;
  const showUpdatedContents = onBranchTip && updatedContents[path];

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

  const onUpdateContent = useCallbackWithProps(
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
          if (onBranchTip) {
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

  let content = "";
  let originalContent = "";
  if (showUpdatedContents) {
    content = updatedContents[path].content;
    originalContent = updatedContents[path].original;
  } else if (fileData) {
    content = fileData.content;
    originalContent = content;
  }
  const isEditable =
    onBranchTip &&
    appContext.hasRepoInstallation &&
    appContext.permissions.push;

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
      originalContent={originalContent}
      isEditable={isEditable}
      onUpdateContent={onUpdateContent}
    />
  );
}
