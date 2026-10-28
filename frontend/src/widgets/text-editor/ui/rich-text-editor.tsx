import { EditorContent, type Editor } from '@tiptap/react'

import './editor.css'

export function RichTextEditor({ editor }: { editor: Editor }) {
  return (
    <div className="mx-auto max-w-2xl">
      <EditorContent editor={editor} />
    </div>
  )
}
