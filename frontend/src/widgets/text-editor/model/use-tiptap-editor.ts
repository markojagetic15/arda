import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyleKit } from '@tiptap/extension-text-style'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { Awareness } from 'y-protocols/awareness'
import type { Doc } from 'yjs'

import type { AwarenessUser } from '@/shared/lib/collaboration'

import { CommentMark } from './comment-mark'

interface UseTiptapEditorInput {
  doc: Doc
  awareness: Awareness
  user: AwarenessUser
}

/** Builds a Tiptap editor whose content lives in the page's shared Yjs document. */
export function useTiptapEditor({ doc, awareness, user }: UseTiptapEditorInput) {
  return useEditor(
    {
      extensions: [
        // Yjs owns undo/redo history for collaborative documents.
        StarterKit.configure({ undoRedo: false }),
        TextStyleKit,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        CommentMark,
        Collaboration.configure({ document: doc }),
        CollaborationCaret.configure({
          provider: { awareness },
          user: { name: user.name, color: user.color },
        }),
      ],
      editorProps: {
        attributes: {
          class: 'tiptap-editor',
        },
      },
    },
    [doc],
  )
}
