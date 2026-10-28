import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Spinner } from '@heroui/react'
import { Search, X } from 'lucide-react'
import { useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { Awareness } from 'y-protocols/awareness'
import type { Doc } from 'yjs'

import { hasRole, type Role } from '@/entities/hierarchy-node'
import { type AwarenessUser, type ConnectionStatus, useCollaboration } from '@/shared/lib/collaboration'
import { useComments } from '@/shared/lib/comments'
import { PageHeader } from '@/widgets/page-header'
import { PresenceAvatars, StatusBadge, useLivePresence } from '@/widgets/page-collaboration'

import { useKanbanBoard } from '../model/use-kanban-board'
import type { KanbanCard } from '../model/types'
import { AddColumnForm } from './add-column-form'
import { CardDetailsDialog } from './card-details-dialog'
import { KanbanCardPreview } from './kanban-card-preview'
import { KanbanColumnView } from './kanban-column'

interface KanbanBoardProps {
  pageId: string
  user: AwarenessUser
  role?: Role
}

export function KanbanBoard({ pageId, user, role }: KanbanBoardProps) {
  const { doc, awareness, status, synced, awarenessStates, socket } = useCollaboration(pageId)

  if (!doc || !awareness || !synced) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader pageId={pageId}>
          <StatusBadge status={status} />
        </PageHeader>
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="sm" />
        </div>
      </div>
    )
  }

  return (
    <KanbanBoardEditor
      pageId={pageId}
      doc={doc}
      awareness={awareness}
      status={status}
      awarenessStates={awarenessStates}
      socket={socket}
      user={user}
      role={role}
    />
  )
}

interface KanbanBoardEditorProps {
  pageId: string
  doc: Doc
  awareness: Awareness
  status: ConnectionStatus
  awarenessStates: Map<number, Record<string, unknown>>
  socket: Socket | null
  user: AwarenessUser
  role?: Role
}

function KanbanBoardEditor({ pageId, doc, awareness, status, awarenessStates, socket, user, role }: KanbanBoardEditorProps) {
  const canEdit = hasRole(role, 'edit')
  const canComment = hasRole(role, 'comment')
  const board = useKanbanBoard(doc, true)
  const { comments, createComment } = useComments(socket)
  const { people } = useLivePresence(awareness, awarenessStates, user)
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [labelFilter, setLabelFilter] = useState<string | null>(null)

  // Without edit access nothing can be dragged (a huge activation distance never triggers).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: canEdit ? 5 : Number.POSITIVE_INFINITY } }),
  )
  const { columns, cards, labels } = board

  const needle = query.trim().toLowerCase()
  const matches = (card: KanbanCard) =>
    (!needle || `${card.title} ${card.description}`.toLowerCase().includes(needle)) &&
    (!labelFilter || card.labelIds.includes(labelFilter))

  const cardsByColumn = new Map(
    columns.map((column) => [
      column.id,
      cards.filter((card) => card.columnId === column.id).sort((a, b) => a.position - b.position),
    ]),
  )
  const openCard = cards.find((card) => card.id === openCardId) ?? null
  const totals = {
    all: cards.length,
    done: cards.filter((card) => /done|complete/i.test(columns.find((column) => column.id === card.columnId)?.title ?? '')).length,
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCard(cards.find((card) => card.id === event.active.id) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return

    const cardId = String(active.id)
    const overId = String(over.id)
    const overColumnId = columns.some((column) => column.id === overId)
      ? overId
      : cards.find((card) => card.id === overId)?.columnId
    if (!overColumnId) return

    const destCards = (cardsByColumn.get(overColumnId) ?? []).filter((card) => card.id !== cardId)
    const overIndex = destCards.findIndex((card) => card.id === overId)
    board.moveCard(cardId, overColumnId, overIndex === -1 ? destCards.length : overIndex)
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader pageId={pageId}>
        <PresenceAvatars users={people} />
        <StatusBadge status={status} />
      </PageHeader>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <label className="flex h-8 w-56 items-center gap-2 rounded-lg border border-border bg-field px-2.5 focus-within:border-accent">
          <Search className="h-3.5 w-3.5 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter cards"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {query ? (
            <button type="button" aria-label="Clear filter" onClick={() => setQuery('')}>
              <X className="h-3.5 w-3.5 text-muted" />
            </button>
          ) : null}
        </label>
        <div className="flex flex-wrap items-center gap-1">
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              aria-pressed={labelFilter === label.id}
              onClick={() => setLabelFilter((current) => (current === label.id ? null : label.id))}
              className="rounded-md px-2 py-1 text-xs font-semibold transition"
              style={
                labelFilter === label.id
                  ? { backgroundColor: label.color, color: 'white' }
                  : { backgroundColor: `${label.color}1a`, color: label.color }
              }
            >
              {label.name}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted tabular-nums">
          {totals.all} {totals.all === 1 ? 'card' : 'cards'}
          {totals.all ? ` · ${Math.round((totals.done / totals.all) * 100)}% done` : ''}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className="scroll-thin flex min-h-0 flex-1 items-start gap-4 overflow-x-auto p-4">
          {columns.map((column) => {
            const columnCards = cardsByColumn.get(column.id) ?? []
            return (
              <KanbanColumnView
                key={column.id}
                column={column}
                cards={columnCards.filter(matches)}
                totalCount={columnCards.length}
                labels={labels}
                comments={comments}
                onCreateCard={(title) => board.createCard(column.id, title)}
                onOpenCard={setOpenCardId}
                onUpdateColumn={(patch) => board.updateColumn(column.id, patch)}
                onDeleteColumn={() => board.deleteColumn(column.id)}
                readOnly={!canEdit}
              />
            )
          })}
          {canEdit ? <AddColumnForm onCreate={board.createColumn} /> : null}
        </div>

        <DragOverlay>
          {activeCard ? <KanbanCardPreview card={activeCard} labels={labels} comments={comments} /> : null}
        </DragOverlay>
      </DndContext>

      {openCard ? (
        <CardDetailsDialog
          card={openCard}
          columns={columns}
          labels={labels}
          comments={comments}
          onClose={() => setOpenCardId(null)}
          onUpdate={(patch) => board.updateCard(openCard.id, patch)}
          onMove={(columnId) => board.moveCard(openCard.id, columnId, cardsByColumn.get(columnId)?.length ?? 0)}
          onDelete={() => {
            board.deleteCard(openCard.id)
            setOpenCardId(null)
          }}
          onCreateLabel={board.createLabel}
          onDeleteLabel={board.deleteLabel}
          onComment={(body) => createComment({ anchorType: 'kanban-card', anchorId: openCard.id, body })}
          readOnly={!canEdit}
          canComment={canComment}
        />
      ) : null}
    </div>
  )
}
