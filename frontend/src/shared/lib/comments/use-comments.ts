import { useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'

import type { Comment, CommentAnchorType } from './types'

export interface CreateCommentInput {
  anchorType: CommentAnchorType
  anchorId: string
  body: string
  parentId?: string | null
}

export interface UseCommentsResult {
  comments: Comment[]
  createComment: (input: CreateCommentInput) => void
  resolveComment: (commentId: string, resolved: boolean) => void
}

/**
 * Comments ride the same per-page Socket.io connection Yjs sync already
 * uses (see `useCollaboration`): the server sends the full comment list for
 * the page on join and again on 'comments-request' ('comments-state'), then
 * pushes 'comment-created' / 'comment-resolved' events to everyone in the
 * room as they happen.
 */
export function useComments(socket: Socket | null): UseCommentsResult {
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    if (!socket) return

    const handleState = (list: Comment[]) => setComments(list)
    const handleCreated = (comment: Comment) =>
      setComments((previous) => (previous.some((c) => c.id === comment.id) ? previous : [...previous, comment]))
    const handleResolved = ({ id, resolved }: { id: string; resolved: boolean }) =>
      setComments((previous) => previous.map((comment) => (comment.id === id ? { ...comment, resolved } : comment)))

    socket.on('comments-state', handleState)
    socket.on('comment-created', handleCreated)
    socket.on('comment-resolved', handleResolved)
    // The comments sent with the join reply may have arrived before this
    // listener existed (the page UI mounts only after the document syncs),
    // so ask for them again now that it's listening.
    socket.emit('comments-request')

    return () => {
      socket.off('comments-state', handleState)
      socket.off('comment-created', handleCreated)
      socket.off('comment-resolved', handleResolved)
    }
  }, [socket])

  function createComment(input: CreateCommentInput) {
    socket?.emit('comment-create', { ...input, parentId: input.parentId ?? null })
  }

  function resolveComment(commentId: string, resolved: boolean) {
    socket?.emit('comment-resolve', { commentId, resolved })
  }

  return { comments, createComment, resolveComment }
}
