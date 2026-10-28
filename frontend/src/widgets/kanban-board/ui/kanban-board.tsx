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
import { useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { Awareness } from 'y-protocols/awareness'
import type { Doc } from 'yjs'

import { type AwarenessUser, type ConnectionStatus, useCollaboration } from '@/shared/lib/collaboration'
import { useComments } from '@/shared/lib/comments'
import { PresenceAvatars, StatusBadge } from '@/widgets/page-collaboration'

import { useKanbanBoard } from '../model/use-kanban-board'
import type { KanbanCard } from '../model/types'
import { AddColumnForm } from './add-column-form'
import { KanbanCardPreview } from './kanban-card-preview'
import { KanbanColumnView } from './kanban-column'

interface KanbanBoardProps {
  pageId: string
  user: AwarenessUser
}

export function KanbanBoard({ pageId, user }: KanbanBoardProps) {
  const { doc, awareness, status, awarenessStates, socket } = useCollaboration(pageId)

  if (!doc || !awareness) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <KanbanBoardEditor
      doc={doc}
      awareness={awareness}
      status={status}
      awarenessStates={awarenessStates}
      socket={socket}
      user={user}
    />
  )
}

interface KanbanBoardEditorProps {
  doc: Doc
  awareness: Awareness
  status: ConnectionStatus
  awarenessStates: Map<number, Record<string, unknown>>
  socket: Socket | null
  user: AwarenessUser
}

function KanbanBoardEditor({ doc, awareness, status, awarenessStates, socket, user }: KanbanBoardEditorProps) {
  const { columns, cards, createColumn, createCard, updateCard, deleteCard, moveCard } = useKanbanBoard(doc)
  const { comments, createComment, resolveComment } = useComments(socket)
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)

  useEffect(() => {
    awareness.setLocalStateField('user', user)
    return () => {
      awareness.setLocalStateField('user', null)
    }
  }, [awareness, user])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const remoteUsers = [...awarenessStates.entries()]
    .filter(([clientId]) => clientId !== awareness.clientID)
    .map(([, state]) => state.user as AwarenessUser | undefined)
    .filter((candidate): candidate is AwarenessUser => Boolean(candidate))

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position)
  const cardsByColumn = new Map(
    sortedColumns.map((column) => [
      column.id,
      cards.filter((card) => card.columnId === column.id).sort((a, b) => a.position - b.position),
    ]),
  )

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

    const destCards = cardsByColumn.get(overColumnId) ?? []
    const overIndex = destCards.findIndex((card) => card.id === overId)
    const toIndex = overIndex === -1 ? destCards.length : overIndex

    moveCard(cardId, overColumnId, toIndex)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-current/10 px-4 py-2">
        <StatusBadge status={status} />
        <PresenceAvatars users={remoteUsers} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className="flex flex-1 items-start gap-4 overflow-x-auto p-4">
          {sortedColumns.map((column) => (
            <KanbanColumnView
              key={column.id}
              column={column}
              cards={cardsByColumn.get(column.id) ?? []}
              comments={comments}
              onCreateCard={(title) => createCard(column.id, title)}
              onUpdateCard={updateCard}
              onDeleteCard={deleteCard}
              onCreateCardComment={(cardId, body) => createComment({ anchorType: 'kanban-card', anchorId: cardId, body })}
              onResolveCardComment={resolveComment}
            />
          ))}
          <AddColumnForm onCreate={createColumn} />
        </div>

        <DragOverlay>{activeCard ? <KanbanCardPreview card={activeCard} /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}
