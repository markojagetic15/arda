import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TableKit } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyleKit } from '@tiptap/extension-text-style'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { useEditor } from '@tiptap/react'
import { useQueryClient } from '@tanstack/react-query'
import StarterKit from '@tiptap/starter-kit'
import type { Awareness } from 'y-protocols/awareness'
import type { Doc } from 'yjs'

import { HIERARCHY_TREE_QUERY_KEY, type HierarchyNode } from '@/entities/hierarchy-node'
import { errorMessage } from '@/shared/api/error-message'
import { uploadImage } from '@/shared/api/uploads'
import type { AwarenessUser } from '@/shared/lib/collaboration'

import { CommentMark } from './comment-mark'
import { ImageUpload } from './image-upload'
import { PageLink } from './page-link'
import { PageMention } from './page-mention'
import { SlashCommand } from './slash-command'
import { TextStyleExtras } from './text-style-extras'

interface UseTiptapEditorInput {
  doc: Doc
  awareness: Awareness
  user: AwarenessUser
  /** False for viewers and commenters. */
  editable: boolean
  /** The page images get uploaded to. */
  pageId: string
}

/** Builds a Tiptap editor whose content lives in the page's shared Yjs document. */
export function useTiptapEditor({ doc, awareness, user, editable, pageId }: UseTiptapEditorInput) {
  const queryClient = useQueryClient()
  return useEditor(
    {
      editable,
      extensions: [
        // Yjs owns undo/redo history for collaborative documents.
        StarterKit.configure({
          undoRedo: false,
          link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
          heading: { levels: [1, 2, 3, 4] },
        }),
        TextStyleKit,
        TextStyleExtras,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Highlight.configure({ multicolor: true }),
        Subscript,
        Superscript,
        TaskList,
        TaskItem.configure({ nested: true }),
        TableKit.configure({ table: { resizable: true } }),
        Image.configure({ inline: false }),
        ImageUpload.configure({
          upload: (file) =>
            uploadImage(pageId, file).catch((error: unknown) => {
              // Bad-file errors are already readable; server errors get the standard wording.
              throw new Error(error instanceof Error && !('status' in error) ? error.message : errorMessage(error))
            }),
        }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === 'heading') return `Heading ${node.attrs.level}`
            return "Write something, or type '/' for blocks..."
          },
        }),
        CharacterCount,
        SlashCommand,
        PageLink,
        PageMention.configure({
          getPages: () =>
            queryClient.getQueryData<{ nodes: HierarchyNode[] }>(HIERARCHY_TREE_QUERY_KEY)?.nodes ?? [],
        }),
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
          spellcheck: 'true',
        },
      },
    },
    [doc, editable, pageId],
  )
}
