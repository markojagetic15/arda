import { track, type Editor, type TLShapeId } from 'tldraw'

import type { Comment } from '@/shared/lib/comments'
import { CommentThreadTrigger } from '@/widgets/comment-thread'

interface CanvasCommentOverlayProps {
  editor: Editor
  comments: Comment[]
  onCreateComment: (shapeId: string, body: string) => void
  onResolveComment: (commentId: string, resolved: boolean) => void
}

/**
 * Floating comment badges over canvas shapes: one for every currently
 * selected shape (so a comment can be started) plus every shape that
 * already has a thread (so it stays visible once deselected). Positions are
 * derived from the shape's page bounds through the editor's camera on every
 * render — `track()` subscribes to whichever camera/shape signals get read.
 */
export const CanvasCommentOverlay = track(function CanvasCommentOverlay({
  editor,
  comments,
  onCreateComment,
  onResolveComment,
}: CanvasCommentOverlayProps) {
  const commentedShapeIds = new Set(
    comments.filter((comment) => comment.anchorType === 'canvas-shape').map((comment) => comment.anchorId),
  )
  const relevantShapeIds = new Set<TLShapeId>([...editor.getSelectedShapeIds(), ...commentedShapeIds] as TLShapeId[])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...relevantShapeIds].map((shapeId) => {
        const bounds = editor.getShapePageBounds(shapeId)
        if (!bounds) return null
        const topRight = editor.pageToViewport({ x: bounds.maxX, y: bounds.minY })

        return (
          <div
            key={shapeId}
            className="pointer-events-auto absolute"
            style={{ left: topRight.x - 12, top: topRight.y - 12 }}
          >
            <CommentThreadTrigger
              comments={comments}
              anchorType="canvas-shape"
              anchorId={shapeId}
              onCreateComment={(body) => onCreateComment(shapeId, body)}
              onResolveToggle={onResolveComment}
            />
          </div>
        )
      })}
    </div>
  )
})
