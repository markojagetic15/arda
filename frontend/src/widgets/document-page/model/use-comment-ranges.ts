import { useEditorState, type Editor } from '@tiptap/react'

export interface CommentRange {
  commentId: string
  from: number
  to: number
  /** The commented text (trimmed to a short excerpt). */
  text: string
}

/** Every commented range in the document, in document order. Recomputed on each transaction. */
export function useCommentRanges(editor: Editor): CommentRange[] {
  return useEditorState({
    editor,
    selector: ({ editor: current }): CommentRange[] => {
      const ranges: CommentRange[] = []
      current.state.doc.descendants((node, pos) => {
        const mark = node.marks.find((candidate) => candidate.type.name === 'comment')
        if (!mark) return
        const commentId = mark.attrs.commentId as string
        const last = ranges.find((range) => range.commentId === commentId)
        if (last && last.to === pos) {
          last.to = pos + node.nodeSize
          last.text += node.text ?? ''
        } else if (!last) {
          ranges.push({ commentId, from: pos, to: pos + node.nodeSize, text: node.text ?? '' })
        }
      })
      return ranges.map((range) => ({
        ...range,
        text: range.text.length > 120 ? `${range.text.slice(0, 117)}...` : range.text,
      }))
    },
  })
}

/** Scrolls the commented text into view and selects it. */
export function revealCommentRange(editor: Editor, range: CommentRange): void {
  editor.chain().setTextSelection({ from: range.from, to: range.to }).run()
  const { node } = editor.view.domAtPos(range.from)
  const element = node instanceof HTMLElement ? node : node.parentElement
  element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}
