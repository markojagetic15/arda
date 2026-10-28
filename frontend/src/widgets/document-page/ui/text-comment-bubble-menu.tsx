import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'

import { CommentIcon } from '@/widgets/comment-thread'

interface TextCommentBubbleMenuProps {
  editor: Editor
  onStartComment: (commentId: string) => void
}

/** Selection toolbar offering "Comment" — applies a comment mark to the selection and hands the new id up. */
export function TextCommentBubbleMenu({ editor, onStartComment }: TextCommentBubbleMenuProps) {
  return (
    <BubbleMenu editor={editor} shouldShow={({ state }) => !state.selection.empty}>
      <button
        type="button"
        onClick={() => {
          const commentId = crypto.randomUUID()
          editor.chain().focus().setComment(commentId).run()
          onStartComment(commentId)
        }}
        aria-label="Add comment"
        className="flex items-center gap-1 rounded-md border border-current/10 bg-background px-2 py-1 text-xs shadow-lg hover:bg-current/5"
      >
        <CommentIcon className="h-3.5 w-3.5" />
        Comment
      </button>
    </BubbleMenu>
  )
}
