import { Button, Popover } from '@heroui/react'
import { useState } from 'react'

import { commentsForAnchor, isThreadResolved, type Comment, type CommentAnchorType } from '@/shared/lib/comments'

import { CommentIcon } from './comment-icon'

interface CommentThreadTriggerProps {
  comments: Comment[]
  anchorType: CommentAnchorType
  anchorId: string
  onCreateComment: (body: string) => void
  onResolveToggle: (commentId: string, resolved: boolean) => void
  className?: string
  /** Opens the thread immediately on mount — used right after starting a brand-new comment. */
  autoOpen?: boolean
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function CommentThreadTrigger({
  comments,
  anchorType,
  anchorId,
  onCreateComment,
  onResolveToggle,
  className,
  autoOpen,
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
      <Button
        variant={thread.length > 0 ? 'primary' : 'ghost'}
        size="sm"
        isIconOnly
        aria-label={thread.length > 0 ? `${thread.length} comment${thread.length === 1 ? '' : 's'}` : 'Add comment'}
        className={className}
      >
        <span className="relative flex items-center justify-center">
          <CommentIcon className={`h-3.5 w-3.5 ${resolved && thread.length > 0 ? 'opacity-50' : ''}`} />
          {thread.length > 0 ? (
            <span className="absolute -top-2 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-blue-500 px-0.5 text-[9px] leading-none text-white">
              {thread.length}
            </span>
          ) : null}
        </span>
      </Button>
      <Popover.Content>
        <Popover.Dialog className="flex w-72 flex-col gap-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide uppercase opacity-60">Comments</span>
            {thread.length > 0 ? (
              <button
                type="button"
                onClick={() => onResolveToggle(thread[0].id, !resolved)}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                {resolved ? 'Reopen' : 'Resolve'}
              </button>
            ) : null}
          </div>

          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {thread.length === 0 ? (
              <p className="text-xs opacity-60">No comments yet — start the conversation.</p>
            ) : (
              thread.map((comment) => (
                <div key={comment.id} className="text-xs">
                  <span className="font-medium">{comment.authorName}</span>{' '}
                  <span className="opacity-50">{formatTime(comment.createdAt)}</span>
                  <p className="mt-0.5">{comment.body}</p>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
            className="flex gap-1"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a comment…"
              aria-label="Write a comment"
              className="min-w-0 flex-1 rounded border border-current/20 bg-transparent px-2 py-1 text-xs outline-none focus:border-current/40"
            />
            <button
              type="submit"
              className="rounded border border-current/20 px-2 py-1 text-xs hover:bg-current/5"
            >
              Send
            </button>
          </form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}
