import { Popover } from '@heroui/react'
import { CheckCircle2, MessageSquare, RotateCcw, Send } from 'lucide-react'
import { useState } from 'react'

import { UserAvatar } from '@/entities/user'
import { commentsForAnchor, isThreadResolved, type Comment, type CommentAnchorType } from '@/shared/lib/comments'

interface CommentThreadTriggerProps {
  comments: Comment[]
  anchorType: CommentAnchorType
  anchorId: string
  onCreateComment: (body: string) => void
  onResolveToggle: (commentId: string, resolved: boolean) => void
  className?: string
  /** Opens the thread immediately on mount - used right after starting a brand-new comment. */
  autoOpen?: boolean
  /** False for viewers: the thread is shown read-only. */
  canComment?: boolean
}

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function CommentThreadTrigger({
  comments,
  anchorType,
  anchorId,
  onCreateComment,
  onResolveToggle,
  className = '',
  autoOpen,
  canComment = true,
}: CommentThreadTriggerProps) {
  const thread = commentsForAnchor(comments, anchorType, anchorId)
  const resolved = isThreadResolved(thread)
  const [draft, setDraft] = useState('')
  const [isOpen, setIsOpen] = useState(autoOpen ?? false)

  function submit() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onCreateComment(trimmed)
    setDraft('')
  }

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        aria-label={thread.length > 0 ? `${thread.length} comment${thread.length === 1 ? '' : 's'}` : 'Add comment'}
        className={`inline-flex h-6 items-center gap-1 rounded-full px-1.5 text-[11px] font-semibold shadow-sm transition ${
          thread.length === 0
            ? 'border border-border bg-surface text-muted hover:text-foreground'
            : resolved
              ? 'border border-border bg-surface text-muted'
              : 'bg-accent text-accent-foreground'
        } ${className}`}
      >
        <MessageSquare className="h-3 w-3" />
        {thread.length > 0 ? thread.length : null}
      </Popover.Trigger>
      <Popover.Content className="w-80">
        <Popover.Dialog className="flex flex-col gap-3 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              Comments {resolved && thread.length > 0 ? <span className="font-normal text-muted">(resolved)</span> : null}
            </span>
            {thread.length > 0 && canComment ? (
              <button
                type="button"
                onClick={() => onResolveToggle(thread[0].id, !resolved)}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted hover:bg-default hover:text-foreground"
              >
                {resolved ? <RotateCcw className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {resolved ? 'Reopen' : 'Resolve'}
              </button>
            ) : null}
          </div>

          <div className="scroll-thin flex max-h-72 flex-col gap-3 overflow-y-auto">
            {thread.length === 0 ? (
              <p className="text-xs text-muted">No comments yet. Start the conversation.</p>
            ) : (
              thread.map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <UserAvatar name={comment.authorName} id={comment.authorId} size="xs" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-semibold">{comment.authorName}</span>{' '}
                      <span className="text-muted">{timeAgo(comment.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">{comment.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {canComment ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
            className="flex items-end gap-1.5 rounded-xl border border-border bg-field p-1.5 focus-within:border-accent"
          >
            <textarea
              value={draft}
              autoFocus
              rows={2}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
              placeholder={thread.length ? 'Reply...' : 'Write a comment...'}
              aria-label="Write a comment"
              className="min-w-0 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
          ) : null}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}
