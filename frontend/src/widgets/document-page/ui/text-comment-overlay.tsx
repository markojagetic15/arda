import type { Editor } from '@tiptap/react'
import { useCallback, useLayoutEffect, useState, type RefObject } from 'react'

import { commentsForAnchor, type Comment } from '@/shared/lib/comments'
import { CommentThreadTrigger } from '@/widgets/comment-thread'

import type { CommentRange } from '../model/use-comment-ranges'

interface BadgePosition {
  commentId: string
  top: number
  left: number
}

interface TextCommentOverlayProps {
  editor: Editor
  ranges: CommentRange[]
  comments: Comment[]
  containerRef: RefObject<HTMLDivElement | null>
  newCommentId: string | null
  onCreateComment: (commentId: string, body: string) => void
  onResolveComment: (commentId: string, resolved: boolean) => void
  canComment: boolean
}

/**
 * One floating comment badge per commented text range that has (or is
 * about to get) a thread, in the right margin next to the line where the
 * comment ends (ProseMirror's `coordsAtPos`), so it never covers text.
 * Badges on the same line are stacked. Positions are recomputed whenever the ranges
 * change and whenever the layout can move them without an edit: resizes,
 * web fonts finishing loading, and the first frame after mount (on a fresh
 * load the synced content renders after this component).
 */
export function TextCommentOverlay({
  editor,
  ranges,
  comments,
  containerRef,
  newCommentId,
  onCreateComment,
  onResolveComment,
  canComment,
}: TextCommentOverlayProps) {
  const [positions, setPositions] = useState<BadgePosition[]>([])
  const visible = ranges.filter(
    (range) =>
      range.commentId === newCommentId || commentsForAnchor(comments, 'text', range.commentId).length > 0,
  )
  const visibleKey = visible.map((range) => `${range.commentId}:${range.to}`).join('|')

  const recompute = useCallback(() => {
    const container = containerRef.current
    if (!container || !editor.view.dom.isConnected) return
    const containerRect = container.getBoundingClientRect()
    const gutterLeft = editor.view.dom.getBoundingClientRect().right - containerRect.left + container.scrollLeft + 12
    const next: BadgePosition[] = []
    for (const range of visible) {
      try {
        const coords = editor.view.coordsAtPos(range.to)
        next.push({
          commentId: range.commentId,
          top: coords.top - containerRect.top + container.scrollTop - 2,
          left: gutterLeft,
        })
      } catch {
        // range not rendered yet - the next recompute will place it
      }
    }
    next.sort((a, b) => a.top - b.top)
    for (let i = 1; i < next.length; i++) {
      next[i].top = Math.max(next[i].top, next[i - 1].top + 28)
    }
    setPositions(next)
    // `visibleKey` captures everything about `visible` that affects placement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, containerRef, visibleKey])

  useLayoutEffect(() => {
    recompute()
    const frame = requestAnimationFrame(recompute)
    const observer = new ResizeObserver(recompute)
    observer.observe(editor.view.dom)
    if (containerRef.current) observer.observe(containerRef.current)
    void document.fonts?.ready.then(recompute)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [recompute, editor, containerRef])

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
            canComment={canComment}
          />
        </div>
      ))}
    </>
  )
}
