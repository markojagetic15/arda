import { useEditorState, type Editor } from '@tiptap/react'
import { useLayoutEffect, useState, type RefObject } from 'react'

import type { Comment } from '@/shared/lib/comments'
import { CommentThreadTrigger } from '@/widgets/comment-thread'

interface MarkRange {
  commentId: string
  to: number
}

interface BadgePosition {
  commentId: string
  top: number
  left: number
}

interface TextCommentOverlayProps {
  editor: Editor
  comments: Comment[]
  containerRef: RefObject<HTMLDivElement | null>
  newCommentId: string | null
  onCreateComment: (commentId: string, body: string) => void
  onResolveComment: (commentId: string, resolved: boolean) => void
}

/**
 * One floating comment badge per commented text range, positioned right
 * after the marked text via ProseMirror's `coordsAtPos`. Recomputed on every
 * editor transaction (`useEditorState`'s selector runs then), which also
 * covers positions shifting as the document is edited.
 */
export function TextCommentOverlay({
  editor,
  comments,
  containerRef,
  newCommentId,
  onCreateComment,
  onResolveComment,
}: TextCommentOverlayProps) {
  const markRanges = useEditorState({
    editor,
    selector: ({ editor: current }): MarkRange[] => {
      const ranges: MarkRange[] = []
      current.state.doc.descendants((node, pos) => {
        const mark = node.marks.find((candidate) => candidate.type.name === 'comment')
        if (!mark) return
        const commentId = mark.attrs.commentId as string
        const to = pos + node.nodeSize
        const last = ranges[ranges.length - 1]
        if (last && last.commentId === commentId) {
          last.to = to
        } else {
          ranges.push({ commentId, to })
        }
      })
      return ranges
    },
  })

  const [positions, setPositions] = useState<BadgePosition[]>([])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      setPositions([])
      return
    }
    const containerRect = container.getBoundingClientRect()
    setPositions(
      markRanges.map(({ commentId, to }) => {
        const coords = editor.view.coordsAtPos(to)
        return {
          commentId,
          top: coords.top - containerRect.top + container.scrollTop - 10,
          left: coords.left - containerRect.left + container.scrollLeft + 2,
        }
      }),
    )
  }, [editor, markRanges, containerRef])

  return (
    <>
      {positions.map(({ commentId, top, left }) => (
        <div key={commentId} className="absolute z-10" style={{ top, left }}>
          <CommentThreadTrigger
            comments={comments}
            anchorType="text"
            anchorId={commentId}
            onCreateComment={(body) => onCreateComment(commentId, body)}
            onResolveToggle={onResolveComment}
            autoOpen={commentId === newCommentId}
          />
        </div>
      ))}
    </>
  )
}
