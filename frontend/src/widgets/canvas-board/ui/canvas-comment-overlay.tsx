import { sceneCoordsToViewportCoords } from '@excalidraw/excalidraw'
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { AppState } from '@excalidraw/excalidraw/types'
import type { Comment } from '@/shared/lib/comments'
import { CommentThreadTrigger } from '@/widgets/comment-thread'

export interface ViewState {
  scrollX: number
  scrollY: number
  zoom: AppState['zoom']
  offsetLeft: number
  offsetTop: number
  selectedElementIds: string[]
  elements: readonly OrderedExcalidrawElement[]
}

interface CanvasCommentOverlayProps {
  view: ViewState
  comments: Comment[]
  onCreateComment: (elementId: string, body: string) => void
  onResolveComment: (commentId: string, resolved: boolean) => void
  canComment: boolean
}

/**
 * Floating comment badges at the top-right corner of canvas elements: every
 * selected element (so a thread can be started) plus every element that
 * already has one. Positions are recomputed from the latest scroll/zoom.
 */
export function CanvasCommentOverlay({
  view,
  comments,
  onCreateComment,
  onResolveComment,
  canComment,
}: CanvasCommentOverlayProps) {
  const commented = new Set(
    comments.filter((comment) => comment.anchorType === 'canvas-shape').map((comment) => comment.anchorId),
  )
  // A single selected element only - multi-selections are usually for moving things around.
  const selected = canComment && view.selectedElementIds.length === 1 ? view.selectedElementIds : []
  const ids = new Set([...selected, ...commented])
  if (ids.size === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {view.elements
        .filter((element) => ids.has(element.id) && !element.isDeleted)
        .map((element) => {
          const corner = sceneCoordsToViewportCoords(
            { sceneX: element.x + Math.max(element.width, 0), sceneY: element.y + Math.min(element.height, 0) },
            // Zero offsets give coordinates relative to the canvas container, which this overlay fills.
            { ...view, offsetLeft: 0, offsetTop: 0 },
          )
          return (
            <div
              key={element.id}
              className="pointer-events-auto absolute"
              style={{ left: corner.x + 6, top: corner.y - 30 }}
            >
              <CommentThreadTrigger
                comments={comments}
                anchorType="canvas-shape"
                anchorId={element.id}
                onCreateComment={(body) => onCreateComment(element.id, body)}
                onResolveToggle={onResolveComment}
                canComment={canComment}
              />
            </div>
          )
        })}
    </div>
  )
}
