import { EditorContent, type Editor } from '@tiptap/react'

import './editor.css'

export function RichTextEditor({ editor }: { editor: Editor }) {
  return <EditorContent editor={editor} />
}
