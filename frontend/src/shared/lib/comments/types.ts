export type CommentAnchorType = 'text' | 'canvas-shape' | 'kanban-card'

export interface Comment {
  id: string
  pageId: string
  anchorType: CommentAnchorType
  anchorId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
  /** Meaningful only on the thread's first (earliest) comment - see `isThreadResolved`. */
  resolved: boolean
}

/** All comments sharing one (anchorType, anchorId) form a single flat, chronological thread. */
export function commentsForAnchor(comments: Comment[], anchorType: CommentAnchorType, anchorId: string): Comment[] {
  return comments
    .filter((comment) => comment.anchorType === anchorType && comment.anchorId === anchorId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/** A thread's resolved state lives on its first (root) comment. */
export function isThreadResolved(thread: Comment[]): boolean {
  return thread[0]?.resolved ?? false
}
