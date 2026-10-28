import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'

import { uid } from '@/shared/lib/id'

import { positionBetween, positionForNewItem } from './position'
import { normalizeCard, type CardPatch, type KanbanCard, type KanbanColumn, type KanbanLabel } from './types'

const COLUMNS_MAP = 'kanban-columns'
const CARDS_MAP = 'kanban-cards'
const LABELS_MAP = 'kanban-labels'
const SEED_ORIGIN = 'kanban-seed'

// Fixed ids so concurrent first-joins from multiple clients converge on the
// same records (Yjs resolves same-key writes via last-write-wins) instead of
// racing to create duplicates.
const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'col-todo', title: 'To Do', position: 1000, color: '#94a3b8' },
  { id: 'col-doing', title: 'In Progress', position: 2000, color: '#3b82f6' },
  { id: 'col-done', title: 'Done', position: 3000, color: '#10b981' },
]

const DEFAULT_LABELS: KanbanLabel[] = [
  { id: 'lbl-feature', name: 'Feature', color: '#2563eb' },
  { id: 'lbl-bug', name: 'Bug', color: '#dc2626' },
  { id: 'lbl-design', name: 'Design', color: '#7c3aed' },
  { id: 'lbl-research', name: 'Research', color: '#0891b2' },
]

export interface UseKanbanBoardResult {
  columns: KanbanColumn[]
  cards: KanbanCard[]
  labels: KanbanLabel[]
  createColumn: (title: string) => void
  updateColumn: (columnId: string, patch: Partial<Pick<KanbanColumn, 'title' | 'color'>>) => void
  deleteColumn: (columnId: string) => void
  createCard: (columnId: string, title: string) => void
  updateCard: (cardId: string, patch: CardPatch) => void
  deleteCard: (cardId: string) => void
  moveCard: (cardId: string, toColumnId: string, toIndex: number) => void
  createLabel: (name: string, color: string) => KanbanLabel
  deleteLabel: (labelId: string) => void
}

/**
 * Backs a Kanban board with plain-JSON records in flat `Y.Map`s on the page's
 * shared Yjs document - one record per key, so every move/edit is a single
 * whole-record CRDT write with no array-splice merge conflicts. Card and
 * column order is an explicit `position` number (midpoint on insert).
 */
export function useKanbanBoard(doc: Y.Doc, synced: boolean): UseKanbanBoardResult {
  const columnsMap = useMemo(() => doc.getMap<KanbanColumn>(COLUMNS_MAP), [doc])
  const cardsMap = useMemo(() => doc.getMap<KanbanCard>(CARDS_MAP), [doc])
  const labelsMap = useMemo(() => doc.getMap<KanbanLabel>(LABELS_MAP), [doc])

  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [labels, setLabels] = useState<KanbanLabel[]>([])

  useEffect(() => {
    // Seed only after the server's state is in, or an existing board would
    // get its defaults re-created on every open.
    if (synced) {
      doc.transact(() => {
        if (columnsMap.size === 0) for (const column of DEFAULT_COLUMNS) columnsMap.set(column.id, column)
        if (labelsMap.size === 0) for (const label of DEFAULT_LABELS) labelsMap.set(label.id, label)
      }, SEED_ORIGIN)
    }

    const updateColumns = () => setColumns([...columnsMap.values()].sort((a, b) => a.position - b.position))
    const updateCards = () => setCards([...cardsMap.values()].map(normalizeCard))
    const updateLabels = () => setLabels([...labelsMap.values()])
    columnsMap.observe(updateColumns)
    cardsMap.observe(updateCards)
    labelsMap.observe(updateLabels)
    updateColumns()
    updateCards()
    updateLabels()

    return () => {
      columnsMap.unobserve(updateColumns)
      cardsMap.unobserve(updateCards)
      labelsMap.unobserve(updateLabels)
    }
  }, [doc, synced, columnsMap, cardsMap, labelsMap])

  return {
    columns,
    cards,
    labels,
    createColumn(title) {
      const id = `col-${uid()}`
      columnsMap.set(id, { id, title, position: positionForNewItem(columns), color: '#94a3b8' })
    },
    updateColumn(columnId, patch) {
      const column = columnsMap.get(columnId)
      if (column) columnsMap.set(columnId, { ...column, ...patch })
    },
    deleteColumn(columnId) {
      doc.transact(() => {
        for (const card of cards) if (card.columnId === columnId) cardsMap.delete(card.id)
        columnsMap.delete(columnId)
      })
    },
    createCard(columnId, title) {
      const id = `card-${uid()}`
      const siblings = cards.filter((card) => card.columnId === columnId)
      cardsMap.set(
        id,
        normalizeCard({ id, columnId, title, position: positionForNewItem(siblings), createdAt: new Date().toISOString() }),
      )
    },
    updateCard(cardId, patch) {
      const card = cardsMap.get(cardId)
      if (card) cardsMap.set(cardId, { ...normalizeCard(card), ...patch })
    },
    deleteCard(cardId) {
      cardsMap.delete(cardId)
    },
    moveCard(cardId, toColumnId, toIndex) {
      const card = cardsMap.get(cardId)
      if (!card) return
      const destSiblings = cards
        .filter((sibling) => sibling.columnId === toColumnId && sibling.id !== cardId)
        .sort((a, b) => a.position - b.position)
      const position = positionBetween(destSiblings[toIndex - 1]?.position, destSiblings[toIndex]?.position)
      cardsMap.set(cardId, { ...normalizeCard(card), columnId: toColumnId, position })
    },
    createLabel(name, color) {
      const label = { id: `lbl-${uid()}`, name, color }
      labelsMap.set(label.id, label)
      return label
    },
    deleteLabel(labelId) {
      doc.transact(() => {
        labelsMap.delete(labelId)
        for (const card of cards) {
          if (card.labelIds.includes(labelId)) {
            cardsMap.set(card.id, { ...card, labelIds: card.labelIds.filter((id) => id !== labelId) })
          }
        }
      })
    },
  }
}
