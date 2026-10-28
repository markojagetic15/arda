import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Spinner } from '@heroui/react'
import { Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { HierarchyNode } from '@/entities/hierarchy-node'
import {
  DeleteConfirmDialog,
  MoveToDialog,
  useCreateAndOpen,
  useHierarchyTree,
  useMoveNode,
  useRenameNode,
} from '@/features/hierarchy-tree'
import { readLocal, writeLocal } from '@/shared/lib/storage/local'

import { classifyDropPosition, computeMove, isValidDrop, type DropIndicator } from '../lib/drop-target'
import { flattenTree, type FlatNode } from '../lib/flatten-tree'
import { TreeRow } from './tree-row'
import { TreeRowPreview } from './tree-row-preview'

const COLLAPSED_KEY = 'proarda-collapsed-nodes'

function pointerY(event: DragMoveEvent): number | null {
  const start = event.activatorEvent as PointerEvent | MouseEvent | undefined
  return start && 'clientY' in start ? start.clientY + event.delta.y : null
}

export function SidebarTree() {
  const { data, isPending, isError } = useHierarchyTree()
  const create = useCreateAndOpen()
  const renameNode = useRenameNode()
  const moveNode = useMoveNode()
  const navigate = useNavigate()
  const { pageId: selectedId } = useParams<{ pageId?: string }>()

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set(readLocal<string[]>(COLLAPSED_KEY, [])))
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HierarchyNode | null>(null)
  const [moveTarget, setMoveTarget] = useState<HierarchyNode | null>(null)
  const [activeNode, setActiveNode] = useState<FlatNode | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const nodes = data?.nodes ?? []
  const sections = flattenTree(nodes, collapsedIds)
  const flatById = new Map([...sections.spaces, ...sections.shared].map((node) => [node.id, node]))

  function updateCollapsed(update: (next: Set<string>) => void) {
    setCollapsedIds((previous) => {
      const next = new Set(previous)
      update(next)
      writeLocal(COLLAPSED_KEY, [...next])
      return next
    })
  }

  function toggleCollapse(id: string) {
    updateCollapsed((next) => (next.has(id) ? next.delete(id) : next.add(id)))
  }

  /** Keeps a parent expanded after something is created inside it, so the new item is visible. */
  function expand(id: string) {
    if (collapsedIds.has(id)) updateCollapsed((next) => next.delete(id))
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveNode(flatById.get(String(event.active.id)) ?? null)
    setDropIndicator(null)
  }

  // Recomputed on every pointer move, so moving within a row switches
  // between "above", "inside" and "below".
  function handleDragMove(event: DragMoveEvent) {
    const { active, over } = event
    const activeFlat = flatById.get(String(active.id))
    const overFlat = over ? flatById.get(String(over.id)) : undefined
    const y = pointerY(event)
    if (!over || !activeFlat || !overFlat || y === null) {
      setDropIndicator(null)
      return
    }
    const position = classifyDropPosition(over.rect, y)
    const next = isValidDrop(nodes, activeFlat, overFlat, position) ? { overId: overFlat.id, position } : null
    setDropIndicator((current) =>
      current?.overId === next?.overId && current?.position === next?.position ? current : next,
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const indicator = dropIndicator
    setActiveNode(null)
    setDropIndicator(null)
    if (!indicator) return
    const activeFlat = flatById.get(String(event.active.id))
    const overFlat = flatById.get(indicator.overId)
    if (!activeFlat || !overFlat) return
    const move = computeMove(nodes, activeFlat, overFlat, indicator.position)
    if (move) {
      if (indicator.position === 'inside') expand(overFlat.id)
      moveNode.mutate(move)
    }
  }

  if (isPending) {
    return (
      <div className="flex justify-center p-4">
        <Spinner size="sm" />
      </div>
    )
  }

  if (isError) {
    return <p className="p-4 text-sm text-muted">Couldn&apos;t load your workspace. Refresh to try again.</p>
  }

  const renderRow = (node: FlatNode) => (
    <TreeRow
      key={node.id}
      node={node}
      isCollapsed={collapsedIds.has(node.id)}
      isRenaming={renamingId === node.id}
      isSelected={selectedId === node.id}
      isDragging={activeNode?.id === node.id}
      dropIndicator={dropIndicator?.overId === node.id ? dropIndicator.position : null}
      onToggleCollapse={() => toggleCollapse(node.id)}
      onSelectRow={() => (node.kind === 'page' ? navigate(`/workspace/${node.id}`) : toggleCollapse(node.id))}
      onStartRename={() => setRenamingId(node.id)}
      onCommitRename={(label) => {
        renameNode.mutate({ id: node.id, kind: node.kind, label })
        setRenamingId(null)
      }}
      onCancelRename={() => setRenamingId(null)}
      onRequestDelete={() => setDeleteTarget(node)}
      onRequestMove={() => setMoveTarget(node)}
      onCreated={expand}
    />
  )

  return (
    <nav className="flex flex-col gap-0.5 px-2 pb-4" aria-label="Workspace navigation">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveNode(null)
          setDropIndicator(null)
        }}
      >
        <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
          <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Spaces</span>
          <button
            type="button"
            aria-label="New space"
            title="New space"
            disabled={create.isPending}
            onClick={() => create.space()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-default hover:text-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {sections.spaces.length === 0 ? (
          <button
            type="button"
            onClick={() => create.space()}
            className="mx-1 flex flex-col items-start gap-1 rounded-xl border border-dashed border-border p-3 text-left text-sm hover:border-accent hover:bg-accent-soft/40"
          >
            <span className="font-medium">Create your first space</span>
            <span className="text-xs text-muted">A home for your projects and pages.</span>
          </button>
        ) : (
          sections.spaces.map(renderRow)
        )}

        {sections.shared.length > 0 ? (
          <>
            <div className="mt-4 flex items-center gap-1.5 px-2 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">
              <Users className="h-3.5 w-3.5" /> Shared with me
            </div>
            {sections.shared.map(renderRow)}
          </>
        ) : null}

        <DragOverlay dropAnimation={null}>{activeNode ? <TreeRowPreview node={activeNode} /> : null}</DragOverlay>
      </DndContext>

      <DeleteConfirmDialog node={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <MoveToDialog node={moveTarget} nodes={nodes} onClose={() => setMoveTarget(null)} />
    </nav>
  )
}
