import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button, IconPlus, Spinner } from '@heroui/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { HierarchyNode } from '@/entities/hierarchy-node'
import {
  DeleteConfirmDialog,
  MoveToDialog,
  useCreateSpace,
  useHierarchyTree,
  useMoveNode,
  useRenameNode,
} from '@/features/hierarchy-tree'

import { classifyDropPosition, computeMove, isValidDrop, type DropIndicator } from '../lib/drop-target'
import { flattenTree, type FlatNode } from '../lib/flatten-tree'
import { TreeRow } from './tree-row'
import { TreeRowPreview } from './tree-row-preview'

export function SidebarTree() {
  const { data, isPending, isError } = useHierarchyTree()
  const createSpace = useCreateSpace()
  const renameNode = useRenameNode()
  const moveNode = useMoveNode()
  const navigate = useNavigate()
  const { pageId: selectedId } = useParams<{ pageId?: string }>()

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HierarchyNode | null>(null)
  const [moveTarget, setMoveTarget] = useState<HierarchyNode | null>(null)
  const [activeNode, setActiveNode] = useState<FlatNode | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const nodes = data?.nodes ?? []
  const flatNodes = flattenTree(nodes, collapsedIds)
  const flatById = new Map(flatNodes.map((node) => [node.id, node]))

  function toggleCollapse(id: string) {
    setCollapsedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveNode(flatById.get(String(event.active.id)) ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      setDropIndicator(null)
      return
    }

    const activeFlat = flatById.get(String(active.id))
    const overFlat = flatById.get(String(over.id))
    const activeRect = active.rect.current.translated
    if (!activeFlat || !overFlat || !activeRect) {
      setDropIndicator(null)
      return
    }

    const centerY = activeRect.top + activeRect.height / 2
    const position = classifyDropPosition(over.rect, centerY)
    if (!isValidDrop(activeFlat, overFlat, position)) {
      setDropIndicator(null)
      return
    }
    setDropIndicator({ overId: overFlat.id, position })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const indicator = dropIndicator
    setActiveNode(null)
    setDropIndicator(null)
    if (!over || !indicator || indicator.overId !== over.id) return

    const activeFlat = flatById.get(String(active.id))
    const overFlat = flatById.get(String(over.id))
    if (!activeFlat || !overFlat) return

    const move = computeMove(nodes, activeFlat, overFlat, indicator.position)
    if (move) {
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
    return <p className="p-4 text-sm">Couldn&apos;t load your workspace.</p>
  }

  return (
    <nav className="flex h-full flex-col gap-0.5 overflow-y-auto p-2" aria-label="Workspace navigation">
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-xs font-medium tracking-wide uppercase opacity-60">Spaces</span>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="New space"
          isDisabled={createSpace.isPending}
          onPress={() => createSpace.mutate({ name: 'Untitled space' })}
        >
          <IconPlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveNode(null)
          setDropIndicator(null)
        }}
      >
        <SortableContext items={flatNodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
          {flatNodes.length === 0 ? (
            <p className="px-1 py-2 text-sm opacity-60">No spaces yet — create one to get started.</p>
          ) : (
            flatNodes.map((node) => (
              <TreeRow
                key={node.id}
                node={node}
                isCollapsed={collapsedIds.has(node.id)}
                isRenaming={renamingId === node.id}
                isSelected={selectedId === node.id}
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
              />
            ))
          )}
        </SortableContext>

        <DragOverlay>{activeNode ? <TreeRowPreview node={activeNode} /> : null}</DragOverlay>
      </DndContext>

      <DeleteConfirmDialog node={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <MoveToDialog node={moveTarget} nodes={nodes} onClose={() => setMoveTarget(null)} />
    </nav>
  )
}
