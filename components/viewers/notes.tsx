import { useEffect, useMemo, useState } from "react";
import { Editor } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import debounce from 'lodash/debounce';
import {
  BiBold,
  BiItalic,
  BiStrikethrough,
  BiCodeAlt,
  BiX,
  BiHeading,
  BiListUl,
  BiListOl,
  BiCodeBlock,
  BiMessage,
  BiMinus,
} from 'react-icons/bi';

export function NotesViewer({ contents, owner, repo, path }: {
  contents: string,
  owner: string,
  repo: string,
  path: string
}) {
  const username = "wattenberger"
  const [editor, setEditor] = useState(null);

  const getYdocUpdate = (str: string) => {
    try {
      const ints = atob(str);
      return ints.split(',').map(int => parseInt(int));
    } catch (e) {
      console.log('e', e);
      return [];
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return null;

    const ydoc = new Y.Doc();
    console.log(contents)
    try {
      // @ts-ignore
      if (contents && getYdocUpdate(contents)) Y.applyUpdate(ydoc, getYdocUpdate(contents));
    } catch (e) {
      console.log('e', e);
    }
    const workspaceId = `devex-composable-github--notes-${owner}_${repo}_${path}`;
    // new IndexeddbPersistence(workspaceId, ydoc)
    const provider = new WebrtcProvider(workspaceId, ydoc);
    const collaborationExtension = Collaboration.configure({
      document: ydoc,
    });

    const collaborationCursors = CollaborationCursor.configure({
      provider: provider,
      user: {
        name: username,
        color: '#5046E4',
      },
      render: user => {
        const cursor = document.createElement('span');
        cursor.classList.add('collaboration-cursor__caret');
        cursor.setAttribute('style', `border-color: ${user.color}; color: white; position: absolute`);

        const label = document.createElement('div');
        label.classList.add('collaboration-cursor__label');
        label.setAttribute('style', `color: white; background-color: ${user.color}; padding: 0.2em 0.3em 0.3em; line-height: 1em; border-radius: 0.3em;`);
        label.insertBefore(document.createTextNode(user.name), null);
        cursor.insertBefore(label, null);

        return cursor;
      },
    });

    const updateFileDebounced = debounce(() => {
      // updateDoc(workspaceDoc, {
      //   notes: btoa(Y.encodeStateAsUpdate(ydoc)),
      // });
    });

    const editor = new Editor({
      extensions: [
        StarterKit,
        collaborationExtension,
        collaborationCursors,
      ].filter(Boolean),
      autofocus: 'start',
      editorProps: {
        attributes: {
          class: 'h-full focus:outline-none',
        },
      },
      // content: data?.notes, // now applied above
      onUpdate: () => {
        updateFileDebounced();
      },
    });
    setEditor(editor);

    return () => {
      if (provider) {
        provider.destroy();
      }
    };
  }, [contents]);

  return (
    <div className="h-80 p-3">
      <MenuBar editor={editor} />
      <div className="w-full h-full editor">
        {editor && <EditorContent className="h-full" editor={editor} />}
      </div>
    </div>
  );
};

const buttonClass =
  'bg-white py-1 px-2 m-[2px] hover:bg-indigo-50 focus:outline-none focus:bg-indigo-50';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="ml-[-0.8em]">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${buttonClass} ${editor.isActive('bold') ? 'is-active' : ''
          }`}
      >
        <BiBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${buttonClass} ${editor.isActive('italic') ? 'is-active' : ''
          }`}
      >
        <BiItalic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${buttonClass} ${editor.isActive('strike') ? 'is-active' : ''
          }`}
      >
        <BiStrikethrough />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`${buttonClass} ${editor.isActive('code') ? 'is-active' : ''
          }`}
      >
        <BiCodeAlt />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${buttonClass} ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''
          }`}
      >
        <BiHeading />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${buttonClass} ${editor.isActive('bulletList') ? 'is-active' : ''
          }`}
      >
        <BiListUl />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${buttonClass} ${editor.isActive('orderedList') ? 'is-active' : ''
          }`}
      >
        <BiListOl />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`${buttonClass} ${editor.isActive('codeBlock') ? 'is-active' : ''
          }`}
      >
        <BiCodeBlock />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${buttonClass} ${editor.isActive('blockquote') ? 'is-active' : ''
          }`}
      >
        <BiMessage />
      </button>
      <button
        className={buttonClass}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <BiMinus />
      </button>
      <button
        className={buttonClass}
        onClick={() => editor.chain().focus().clearNodes().run()}
      >
        <BiX />
      </button>
    </div>
  );
};
