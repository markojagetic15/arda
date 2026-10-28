import { CheckCircle2, ChevronDown, MessageSquare, RotateCcw, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { UserAvatar } from '@/entities/user'
import { commentsForAnchor, isThreadResolved, type Comment } from '@/shared/lib/comments'

import type { CommentRange } from '../model/use-comment-ranges'

interface CommentsPanelProps {
  ranges: CommentRange[]
  comments: Comment[]
  activeThreadId: string | null
  canComment: boolean
  onSelectThread: (commentId: string) => void
  onReply: (commentId: string, body: string) => void
  onResolve: (rootCommentId: string, resolved: boolean) => void
}

interface Thread {
  id: string
  excerpt: string | null
  range: CommentRange | null
  comments: Comment[]
  resolved: boolean
}

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function ThreadCard({
  thread,
  active,
  canComment,
  onSelect,
  onReply,
  onResolve,
}: {
  thread: Thread
  active: boolean
  canComment: boolean
  onSelect: () => void
  onReply: (body: string) => void
  onResolve: (resolved: boolean) => void
}) {
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [active])

  function send() {
    const body = draft.trim()
    if (!body) return
    onReply(body)
    setDraft('')
  }

  return (
    <div
      ref={ref}
      className={`rounded-xl border p-3 transition ${
        active ? 'border-accent bg-accent-soft/40 shadow-sm' : 'border-border bg-surface'
      } ${thread.resolved ? 'opacity-75' : ''}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        {thread.excerpt ? (
          <button
            type="button"
            onClick={onSelect}
            title="Show in document"
            className="min-w-0 flex-1 truncate border-l-2 border-warning pl-2 text-left text-xs text-muted hover:text-foreground"
          >
            {thread.excerpt}
          </button>
        ) : (
          <span className="flex-1 border-l-2 border-border pl-2 text-xs text-muted italic">Commented text was deleted</span>
        )}
        {canComment ? (
          <button
            type="button"
            onClick={() => onResolve(!thread.resolved)}
            title={thread.resolved ? 'Reopen' : 'Resolve'}
            className="flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-muted hover:bg-default hover:text-foreground"
          >
            {thread.resolved ? <RotateCcw className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {thread.resolved ? 'Reopen' : 'Resolve'}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5">
        {thread.comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <UserAvatar name={comment.authorName} id={comment.authorId} size="xs" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs">
                <span className="font-semibold">{comment.authorName}</span>{' '}
                <span className="text-muted">{timeAgo(comment.createdAt)}</span>
              </p>
              <p className="text-sm break-words whitespace-pre-wrap">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      {canComment && !thread.resolved ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            send()
          }}
          className="mt-2.5 flex items-end gap-1.5 rounded-lg border border-border bg-field p-1 focus-within:border-accent"
        >
          <textarea
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
            placeholder="Reply..."
            aria-label="Reply"
            className="min-w-0 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send reply"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground disabled:opacity-40"
          >
            <Send className="h-3 w-3" />
          </button>
        </form>
      ) : null}
    </div>
  )
}

/** Every comment thread on the page, in document order, with replies and resolve. */
export function CommentsPanel({
  ranges,
  comments,
  activeThreadId,
  canComment,
  onSelectThread,
  onReply,
  onResolve,
}: CommentsPanelProps) {
  const [showResolved, setShowResolved] = useState(false)

  const anchorIds = [
    ...ranges.map((range) => range.commentId),
    // Threads whose text was deleted still exist - list them after the rest.
    ...[...new Set(comments.filter((c) => c.anchorType === 'text').map((c) => c.anchorId))].filter(
      (id) => !ranges.some((range) => range.commentId === id),
    ),
  ]
  const threads: Thread[] = anchorIds
    .map((id) => {
      const thread = commentsForAnchor(comments, 'text', id)
      const range = ranges.find((candidate) => candidate.commentId === id) ?? null
      return { id, excerpt: range?.text ?? null, range, comments: thread, resolved: isThreadResolved(thread) }
    })
    .filter((thread) => thread.comments.length > 0)
  const open = threads.filter((thread) => !thread.resolved)
  const resolved = threads.filter((thread) => thread.resolved)

  const card = (thread: Thread) => (
    <ThreadCard
      key={thread.id}
      thread={thread}
      active={thread.id === activeThreadId}
      canComment={canComment}
      onSelect={() => onSelectThread(thread.id)}
      onReply={(body) => onReply(thread.id, body)}
      onResolve={(next) => onResolve(thread.comments[0].id, next)}
    />
  )

  return (
    <div className="flex flex-col gap-3 p-4">
      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <MessageSquare className="h-8 w-8 text-muted" />
          <p className="text-sm font-medium">No comments yet</p>
          <p className="text-xs text-muted">
            {canComment ? 'Select text and choose "Comment" to start a thread.' : 'Comments on this page will appear here.'}
          </p>
        </div>
      ) : null}
      {open.map(card)}
      {resolved.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setShowResolved((value) => !value)}
            className="flex items-center gap-1.5 pt-2 text-xs font-semibold text-muted hover:text-foreground"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showResolved ? '' : '-rotate-90'}`} />
            Resolved ({resolved.length})
          </button>
          {showResolved ? resolved.map(card) : null}
        </>
      ) : null}
    </div>
  )
}
