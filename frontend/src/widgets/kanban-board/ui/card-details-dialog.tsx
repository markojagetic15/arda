import { CalendarDays, CheckSquare, Flag, MessageSquare, Plus, Send, Tag, Trash2, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { extractPageLinks } from '@/entities/hierarchy-node'
import { UserAvatar } from '@/entities/user'
import { PageLinkChip } from '@/features/hierarchy-tree'
import { commentsForAnchor, type Comment } from '@/shared/lib/comments'
import { uid } from '@/shared/lib/id'

import { DUE_STYLES, dueState, formatDue } from '../lib/due'
import {
  LABEL_COLORS,
  PRIORITIES,
  type CardPatch,
  type KanbanCard,
  type KanbanColumn,
  type KanbanLabel,
} from '../model/types'

interface CardDetailsDialogProps {
  card: KanbanCard
  columns: KanbanColumn[]
  labels: KanbanLabel[]
  comments: Comment[]
  onClose: () => void
  onUpdate: (patch: CardPatch) => void
  onMove: (columnId: string) => void
  onDelete: () => void
  onCreateLabel: (name: string, color: string) => KanbanLabel
  onDeleteLabel: (labelId: string) => void
  onComment: (body: string) => void
  /** Viewers and commenters see the card but can't change it. */
  readOnly: boolean
  canComment: boolean
}

function SideBlock({ icon: Icon, title, children }: { icon: typeof Tag; title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      {children}
    </div>
  )
}

/** Text that is edited locally and saved on blur, so remote edits don't fight the cursor. */
function useDraft(value: string, save: (value: string) => void) {
  const [draft, setDraft] = useState(value)
  const [source, setSource] = useState(value)
  if (value !== source) {
    setSource(value)
    setDraft(value)
  }
  return { draft, setDraft, commit: () => draft !== value && save(draft) }
}

export function CardDetailsDialog({
  card,
  columns,
  labels,
  comments,
  onClose,
  onUpdate,
  onMove,
  onDelete,
  onCreateLabel,
  onDeleteLabel,
  onComment,
  readOnly,
  canComment,
}: CardDetailsDialogProps) {
  const title = useDraft(card.title, (value) => onUpdate({ title: value.trim() || 'Untitled task' }))
  const description = useDraft(card.description, (value) => onUpdate({ description: value }))
  const [newItem, setNewItem] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0])
  const [commentDraft, setCommentDraft] = useState('')
  const thread = commentsForAnchor(comments, 'kanban-card', card.id)
  const done = card.checklist.filter((item) => item.done).length

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function toggleLabel(labelId: string) {
    onUpdate({
      labelIds: card.labelIds.includes(labelId)
        ? card.labelIds.filter((id) => id !== labelId)
        : [...card.labelIds, labelId],
    })
  }

  function addChecklistItem() {
    const text = newItem.trim()
    if (!text) return
    onUpdate({ checklist: [...card.checklist, { id: uid(), text, done: false }] })
    setNewItem('')
  }

  function sendComment() {
    const body = commentDraft.trim()
    if (!body) return
    onComment(body)
    setCommentDraft('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px] animate-fade-in sm:pt-[8vh]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-label={card.title}
        className="app-shadow-lg w-full max-w-3xl rounded-2xl border border-border bg-overlay animate-rise"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <select
            value={card.columnId}
            onChange={(event) => onMove(event.target.value)}
            disabled={readOnly}
            aria-label="Column"
            className="h-8 cursor-pointer rounded-lg border border-border bg-surface px-2 text-xs font-semibold outline-none"
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-default hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[1fr_220px]">
          <div className="flex min-w-0 flex-col gap-6">
            <fieldset disabled={readOnly} className="contents">
            <textarea
              rows={1}
              value={title.draft}
              onChange={(event) => title.setDraft(event.target.value.replace(/\n/g, ''))}
              onBlur={title.commit}
              onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), event.currentTarget.blur())}
              aria-label="Card title"
              className="font-display w-full resize-none bg-transparent text-2xl font-bold outline-none [field-sizing:content]"
            />

            <div>
              <p className="mb-2 text-sm font-semibold">Description</p>
              <textarea
                value={description.draft}
                onChange={(event) => description.setDraft(event.target.value)}
                onBlur={description.commit}
                placeholder="Add more detail... paste a page link to reference it"
                rows={4}
                className="w-full resize-y rounded-xl border border-border bg-field px-3 py-2 text-sm outline-none focus:border-accent"
              />
              {extractPageLinks(description.draft).length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted">Linked pages:</span>
                  {extractPageLinks(description.draft).map((pageId) => (
                    <PageLinkChip key={pageId} pageId={pageId} className="text-xs" />
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <CheckSquare className="h-4 w-4 text-muted" /> Checklist
                </p>
                {card.checklist.length ? (
                  <span className="text-xs text-muted tabular-nums">
                    {done}/{card.checklist.length}
                  </span>
                ) : null}
              </div>
              {card.checklist.length ? (
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-default">
                  <div
                    className={`h-full rounded-full transition-all ${done === card.checklist.length ? 'bg-success' : 'bg-accent'}`}
                    style={{ width: `${(done / card.checklist.length) * 100}%` }}
                  />
                </div>
              ) : null}
              <ul className="flex flex-col gap-0.5">
                {card.checklist.map((item) => (
                  <li key={item.id} className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-default/60">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        onUpdate({
                          checklist: card.checklist.map((entry) =>
                            entry.id === item.id ? { ...entry, done: !entry.done } : entry,
                          ),
                        })
                      }
                      className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                    />
                    <span className={`flex-1 text-sm ${item.done ? 'text-muted line-through' : ''}`}>{item.text}</span>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => onUpdate({ checklist: card.checklist.filter((entry) => entry.id !== item.id) })}
                      className="text-muted opacity-0 group-hover:opacity-100 hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  addChecklistItem()
                }}
                className="mt-1.5 flex gap-1.5"
              >
                <input
                  value={newItem}
                  onChange={(event) => setNewItem(event.target.value)}
                  placeholder="Add an item"
                  className="h-8 flex-1 rounded-lg border border-border bg-field px-2.5 text-sm outline-none focus:border-accent"
                />
                <button type="submit" className="rounded-lg bg-default px-3 text-xs font-semibold hover:bg-default-hover">
                  Add
                </button>
              </form>
            </div>

            </fieldset>

            <div>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-muted" /> Comments
              </p>
              <div className="flex flex-col gap-3">
                {thread.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <UserAvatar name={comment.authorName} id={comment.authorId} size="xs" className="mt-0.5" />
                    <div className="min-w-0 flex-1 rounded-xl bg-surface-secondary px-3 py-2">
                      <p className="text-xs">
                        <span className="font-semibold">{comment.authorName}</span>{' '}
                        <span className="text-muted">{new Date(comment.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </p>
                      <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  </div>
                ))}
                {canComment ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    sendComment()
                  }}
                  className="flex items-end gap-1.5 rounded-xl border border-border bg-field p-1.5 focus-within:border-accent"
                >
                  <textarea
                    rows={1}
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        sendComment()
                      }
                    }}
                    placeholder="Write a comment..."
                    className="min-w-0 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!commentDraft.trim()}
                    aria-label="Send comment"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
                ) : thread.length === 0 ? (
                  <p className="text-xs text-muted">No comments yet.</p>
                ) : null}
              </div>
            </div>
          </div>

          <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-5">
            <SideBlock icon={Tag} title="Labels">
              <div className="flex flex-wrap gap-1.5">
                {labels.map((label) => {
                  const on = card.labelIds.includes(label.id)
                  return (
                    <span key={label.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => toggleLabel(label.id)}
                        aria-pressed={on}
                        className="rounded-md px-2 py-1 text-xs font-semibold transition"
                        style={
                          on
                            ? { backgroundColor: label.color, color: 'white' }
                            : { backgroundColor: `${label.color}1a`, color: label.color }
                        }
                      >
                        {label.name}
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete label ${label.name}`}
                        onClick={() => window.confirm(`Delete the "${label.name}" label from this board?`) && onDeleteLabel(label.id)}
                        className="absolute -top-1.5 -right-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-foreground text-background group-hover:flex"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )
                })}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  const name = newLabel.trim()
                  if (!name) return
                  const label = onCreateLabel(name, newLabelColor)
                  onUpdate({ labelIds: [...card.labelIds, label.id] })
                  setNewLabel('')
                }}
                className="mt-2.5 flex flex-col gap-1.5"
              >
                <div className="flex gap-1">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Label color ${color}`}
                      onClick={() => setNewLabelColor(color)}
                      className={`h-4 w-4 rounded-full ring-offset-1 ring-offset-overlay ${newLabelColor === color ? 'ring-2 ring-accent' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    value={newLabel}
                    onChange={(event) => setNewLabel(event.target.value)}
                    placeholder="New label"
                    className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-field px-2 text-xs outline-none focus:border-accent"
                  />
                  <button type="submit" aria-label="Create label" className="flex h-8 w-8 items-center justify-center rounded-lg bg-default hover:bg-default-hover">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </SideBlock>

            <SideBlock icon={CalendarDays} title="Due date">
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={card.dueDate ?? ''}
                  onChange={(event) => onUpdate({ dueDate: event.target.value || null })}
                  className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-field px-2 text-xs outline-none focus:border-accent"
                />
                {card.dueDate ? (
                  <button
                    type="button"
                    aria-label="Clear due date"
                    onClick={() => onUpdate({ dueDate: null })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-default"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              {card.dueDate ? (
                <span className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${DUE_STYLES[dueState(card.dueDate)]}`}>
                  {dueState(card.dueDate) === 'overdue' ? 'Overdue - ' : ''}
                  {formatDue(card.dueDate)}
                </span>
              ) : null}
            </SideBlock>

            <SideBlock icon={Flag} title="Priority">
              <div className="grid grid-cols-2 gap-1">
                {PRIORITIES.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={card.priority === value}
                    onClick={() => onUpdate({ priority: card.priority === value ? null : value })}
                    className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-medium ${
                      card.priority === value ? 'border-transparent text-white' : 'border-border hover:bg-default'
                    }`}
                    style={card.priority === value ? { backgroundColor: color } : undefined}
                  >
                    <Flag className="h-3 w-3" style={card.priority === value ? undefined : { color }} /> {label}
                  </button>
                ))}
              </div>
            </SideBlock>

            <button
              type="button"
              onClick={() => window.confirm('Delete this card?') && onDelete()}
              className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-soft"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete card
            </button>
          </fieldset>
        </div>
      </div>
    </div>
  )
}
