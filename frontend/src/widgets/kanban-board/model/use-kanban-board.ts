import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'

import { positionBetween, positionForNewItem } from './position'
import type { KanbanCard, KanbanColumn } from './types'

const COLUMNS_MAP = 'kanban-columns'
const CARDS_MAP = 'kanban-cards'
const SEED_ORIGIN = 'kanban-seed'

// Fixed ids so concurrent first-joins from multiple clients converge on the
// same three columns (Yjs resolves same-key writes via last-write-wins)
// instead of racing to create duplicates. Their content is never mutated
// after creation, so re-seeding an already-populated board is always a safe,
// idempotent no-op.
const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'col-todo', title: 'To Do', position: 1000 },
  { id: 'col-doing', title: 'Doing', position: 2000 },
  { id: 'col-done', title: 'Done', position: 3000 },
]

export interface UseKanbanBoardResult {
  columns: KanbanColumn[]
  cards: KanbanCard[]
  createColumn: (title: string) => void
  createCard: (columnId: string, title: string) => void
  updateCard: (cardId: string, patch: Partial<Pick<KanbanCard, 'title' | 'description'>>) => void
  deleteCard: (cardId: string) => void
  moveCard: (cardId: string, toColumnId: string, toIndex: number) => void
}

/**
 * Backs a Kanban board with plain-JSON records in two flat `Y.Map`s on the
 * page's shared Yjs document — mirroring the canvas page's record-per-key
 * approach rather than nested `Y.Array`s, so every move/edit is a single
 * whole-record CRDT write with no array-splice merge conflicts. Card and
 * column order is encoded as an explicit `position` number (gap-of-1000,
 * midpoint-on-insert), the same scheme the backend hierarchy tree uses for
 * sibling ordering.
 */
export function useKanbanBoard(doc: Y.Doc): UseKanbanBoardResult {
  const columnsMap = useMemo(() => doc.getMap<KanbanColumn>(COLUMNS_MAP), [doc])
  const cardsMap = useMemo(() => doc.getMap<KanbanCard>(CARDS_MAP), [doc])

  const [columns, setColumns] = useState<KanbanColumn[]>(() => [...columnsMap.values()])
  const [cards, setCards] = useState<KanbanCard[]>(() => [...cardsMap.values()])

  useEffect(() => {
    if (columnsMap.size === 0) {
      doc.transact(() => {
        for (const column of DEFAULT_COLUMNS) columnsMap.set(column.id, column)
      }, SEED_ORIGIN)
    }

    const updateColumns = () => setColumns([...columnsMap.values()])
    const updateCards = () => setCards([...cardsMap.values()])
    columnsMap.observe(updateColumns)
    cardsMap.observe(updateCards)
    updateColumns()
    updateCards()

    return () => {
      columnsMap.unobserve(updateColumns)
      cardsMap.unobserve(updateCards)
    }
  }, [doc, columnsMap, cardsMap])

  function createColumn(title: string) {
    const id = `col-${crypto.randomUUID()}`
    columnsMap.set(id, { id, title, position: positionForNewItem(columns) })
  }

  function createCard(columnId: string, title: string) {
    const id = `card-${crypto.randomUUID()}`
    const siblings = cards.filter((card) => card.columnId === columnId)
    cardsMap.set(id, { id, columnId, title, description: '', position: positionForNewItem(siblings) })
  }

  function updateCard(cardId: string, patch: Partial<Pick<KanbanCard, 'title' | 'description'>>) {
    const card = cardsMap.get(cardId)
    if (!card) return
    cardsMap.set(cardId, { ...card, ...patch })
  }

  function deleteCard(cardId: string) {
    cardsMap.delete(cardId)
  }

  function moveCard(cardId: string, toColumnId: string, toIndex: number) {
    const card = cardsMap.get(cardId)
    if (!card) return
    const destSiblings = cards
      .filter((sibling) => sibling.columnId === toColumnId && sibling.id !== cardId)
      .sort((a, b) => a.position - b.position)
    const position = positionBetween(destSiblings[toIndex - 1]?.position, destSiblings[toIndex]?.position)
    cardsMap.set(cardId, { ...card, columnId: toColumnId, position })
  }

  return { columns, cards, createColumn, createCard, updateCard, deleteCard, moveCard }
}
