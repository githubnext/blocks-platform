import { RemoteCursorManager } from '@convergencelabs/monaco-collab-ext';
import MonacoEditor from '@monaco-editor/react';
import { PresenceContext } from 'components/PresenceWrapper';
import { useDebounce } from 'hooks';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import { useUnmount } from 'react-use';
import { MonacoBinding } from 'y-monaco';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { ViewerProps } from '.';
import theme from './theme.json';


function LiveCursor({ id, path, start, cursorManager }) {
  const cursorRef = React.useRef(
    cursorManager.addCursor(id, '#45aeb1', id)
  );

  useUnmount(() => {
    if (!cursorRef.current) return;
    cursorRef?.current?.dispose();
  });

  useEffect(() => {
    if (!cursorRef.current) return;
    if (!cursorManager) return;
    const isDisposed =
      cursorRef.current?.isDisposed() ||
      !cursorRef.current._delegate._editor.getModel();
    if (isDisposed) return;
    console.log(start)
    // if (!user.position) return
    cursorRef?.current?.setPosition(start);
    cursorRef?.current?.show();
  }, [start, path]);

  return null;
}

export const Editor = ({ contents, meta }: ViewerProps) => {
  const { language, path } = meta
  const { query } = useRouter();
  const { line, column, endLine, endColumn, branch, username = "wattenberger" } = query;
  const id = branch
  const { positions, setPosition } = useContext(PresenceContext)
  const otherUsers = positions
  console.log(otherUsers)
  const code = contents

  const activeFilePath = path;
  const editedFilePaths = [];

  const monacoEditor = React.useRef(null);
  const remoteCursorManagerRef = React.useRef(null);
  const cursorChangeDisposable = React.useRef(null);
  const participantCursors = React.useRef(null);
  const yMonacoBinding = React.useRef(null);
  const yProvider = React.useRef(null);
  const yDoc = React.useRef(null);

  const onScrollToLine = () => {
    if (!monacoEditor.current) return;
    if (!line) return;

    setTimeout(() => {
      const range = new monaco.Range(
        +line || 0,
        +column || 0,
        +endLine || +line || 0,
        +endColumn || +column || 0
      );

      monacoEditor.current.setSelection(range);
      monacoEditor.current.revealRangeInCenter(
        range,
        monaco.editor.ScrollType.Smooth
      );
      monacoEditor.current.focus();
    }, 100);
  };

  React.useEffect(() => {
    onScrollToLine();
  }, [line, column, code, endLine, endColumn]);

  const handleCursorPosChange = async e => {
    // const { position } = e;

    const selection = monacoEditor.current.getSelection() || {};
    const position = {
      path: path,
      start: {
        lineNumber: selection.startLineNumber,
        column: selection.startColumn,
      },
      end: {
        lineNumber: selection.endLineNumber,
        column: selection.endColumn,
      },
    }

    try {
      setPosition(username, position)
    } catch (e) {
      console.error('Failed to persist position for', username, e);
    }
  };

  const handleMount = editor => {
    monacoEditor.current = editor;
    initializeCollaboration();

    remoteCursorManagerRef.current = new RemoteCursorManager({
      editor,
      tooltips: true,
      tooltipDuration: 10000,
    });

    // Register event handlers and set up refs for disposables
    cursorChangeDisposable.current = editor.onDidChangeCursorPosition(
      handleCursorPosChange
    );
  };

  useEffect(() => {
    if (yProvider.current) {
      yProvider.current.destroy();
    }
    if (yDoc.current) {
      yDoc.current.destroy();
    }

    const workspaceId = `devex-composable--${id}--${encodeURIComponent(activeFilePath)}-monaco3`;

    const ydoc = new Y.Doc();
    yDoc.current = ydoc;

    const provider = new WebrtcProvider(workspaceId, ydoc);
    yProvider.current = provider;

    setPosition(username, {
      path: activeFilePath,
      start: {
        lineNumber: 1,
        column: 1,
      },
      end: {
        lineNumber: 1,
        column: 1,
      },
    })

    return () => {
      if (yProvider.current) {
        yProvider.current.destroy();
      }
      if (yDoc.current) {
        yDoc.current.destroy();
      }
    }
  }, [id, activeFilePath])

  const initializeCollaboration = () => {
    if (!monacoEditor.current) return;
    const editor = monacoEditor.current;

    const type = yDoc.current.getText('monaco');

    type.insert(0, code);

    // Bind Yjs to the editor model
    yMonacoBinding.current = new MonacoBinding(
      type,
      editor.getModel(),
      new Set([editor]),
      yProvider.current?.awareness
    );
  };

  useEffect(() => {
    if (!monacoEditor.current) return;

    handleCursorPosChange({ position: { lineNumber: 0, column: 0 } });
  }, [activeFilePath]);

  function reconcile() {
    // A catch-all function for re-establishing event listeners based on state changing!
    if (!monacoEditor.current || !cursorChangeDisposable.current) return;

    cursorChangeDisposable.current.dispose();
    cursorChangeDisposable.current =
      monacoEditor.current.onDidChangeCursorPosition(handleCursorPosChange);
  }

  // Effect for when paths or username changes
  useEffect(() => {
    if (!monacoEditor.current || !cursorChangeDisposable.current) return;
    reconcile();
  }, [username, monacoEditor, activeFilePath]);

  const updateContentFunc = async content => {
    // updateCodeLocal(content);

    // await setDoc(contentsDoc, {
    //   content: encode(content),
    //   lastEditedBy: username,
    //   lastEdited: new Date().toISOString(),
    // });
  };

  const debouncedUpdateFunc = useDebounce(updateContentFunc, 1000);

  if (!activeFilePath) {
    return (
      <div className="absolute w-full h-full min-h-[70vh] flex items-center justify-center">
        <div className="italic text-gray-500">Open a file to get started</div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="absolute w-full h-full min-h-[70vh] flex items-center justify-center">
        <div className="italic text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <MonacoEditor
        height="100%"
        line={line ? Number(line) : undefined}
        defaultLanguage={language}
        language={language}
        value={code}
        theme="light-theme"
        beforeMount={monaco => {
          // @ts-ignore
          monaco.editor.defineTheme('light-theme', theme);
        }}
        onMount={handleMount}
        onChange={e => {
          if (!e) return;
          // updateDoc(workspaceDoc, {
          //   editedFilePaths: workspace.editedFilePaths
          //     ? arrayUnion({ path: activeFilePath })
          //     : [{ path: activeFilePath }],
          // });
          debouncedUpdateFunc(e);
        }}
        options={{
          fontSize: 16,
          minimap: {
            enabled: false,
          },
          padding: {
            top: 20,
            bottom: 20
          }
        }}
      />
      {remoteCursorManagerRef.current &&
        otherUsers.map(user => {
          if (user.path !== activeFilePath) return null;
          if (user.id === username) return null;

          return (
            <LiveCursor
              key={user.id}
              cursorManager={remoteCursorManagerRef.current}
              {...user}
            />
          );
        })}
    </React.Fragment>
  );
};

export default Editor;
