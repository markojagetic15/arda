import { useDraggable, useDroppable } from '@dnd-kit/core'
import { ChevronRight, Eye, MoreHorizontal, Plus } from 'lucide-react'
import type { CSSProperties } from 'react'

import { hasRole, NodeGlyph } from '@/entities/hierarchy-node'
import { AddPageMenu, NodeContextMenu, useCreateAndOpen } from '@/features/hierarchy-tree'

import type { DropPosition } from '../lib/drop-target'
import type { FlatNode } from '../lib/flatten-tree'
import { RenameInput } from './rename-input'

const INDENT_PX = 14

interface TreeRowProps {
  node: FlatNode
  isCollapsed: boolean
  isRenaming: boolean
  isSelected: boolean
  isDragging: boolean
  dropIndicator: DropPosition | null
  onToggleCollapse: () => void
  onSelectRow: () => void
  onStartRename: () => void
  onCommitRename: (label: string) => void
  onCancelRename: () => void
  onRequestDelete: () => void
  onRequestMove: () => void
  onCreated: (parentId: string) => void
}

const ACTION_BUTTON =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-default hover:text-foreground'

export function TreeRow({
  node,
  isCollapsed,
  isRenaming,
  isSelected,
  isDragging,
  dropIndicator,
  onToggleCollapse,
  onSelectRow,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onRequestDelete,
  onRequestMove,
  onCreated,
}: TreeRowProps) {
  const canEdit = hasRole(node.role, 'edit')
  // Rows stay in place while dragging; only the DragOverlay preview moves.
  const draggable = useDraggable({ id: node.id, disabled: isRenaming || !canEdit })
  const droppable = useDroppable({ id: node.id })
  const create = useCreateAndOpen(onCreated)

  const style: CSSProperties = { paddingLeft: 6 + node.depth * INDENT_PX }
  const isSpace = node.kind === 'space'

  return (
    <div
      ref={(element) => {
        draggable.setNodeRef(element)
        droppable.setNodeRef(element)
      }}
      style={style}
      {...draggable.attributes}
      {...draggable.listeners}
      onClick={onSelectRow}
      onDoubleClick={canEdit ? onStartRename : undefined}
      className={`group relative flex h-8 cursor-pointer items-center gap-1 rounded-lg pr-1 text-sm outline-none select-none focus-visible:ring-2 focus-visible:ring-accent ${
        isDragging ? 'opacity-40' : ''
      } ${
        isSelected
          ? 'bg-accent-soft font-medium text-accent'
          : 'text-foreground/85 hover:bg-default/70 hover:text-foreground'
      } ${isSpace ? 'mt-2 font-semibold first:mt-0' : ''} ${
        dropIndicator === 'inside' ? 'ring-2 ring-accent ring-inset' : ''
      }`}
    >
      {dropIndicator === 'before' ? (
        <div className="pointer-events-none absolute inset-x-2 top-0 h-0.5 -translate-y-px rounded bg-accent" />
      ) : null}
      {dropIndicator === 'after' ? (
        <div className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 translate-y-px rounded bg-accent" />
      ) : null}

      <button
        type="button"
        tabIndex={-1}
        onClick={(event) => {
          event.stopPropagation()
          onToggleCollapse()
        }}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        className={`flex h-5 w-4 shrink-0 items-center justify-center rounded text-muted hover:text-foreground ${
          node.hasChildren ? '' : 'invisible'
        }`}
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
      </button>

      <NodeGlyph node={node} isOpen={node.hasChildren && !isCollapsed} />

      {isRenaming ? (
        <RenameInput defaultValue={node.label} onCommit={onCommitRename} onCancel={onCancelRename} />
      ) : (
        <span className="ml-1 min-w-0 flex-1 truncate">{node.label}</span>
      )}
      {!canEdit && !isRenaming ? (
        <span title={node.role === 'comment' ? 'You can comment' : 'View only'} className="shrink-0 text-muted group-hover:hidden">
          <Eye className="h-3.5 w-3.5" />
        </span>
      ) : null}

      {!isRenaming ? (
        <span
          className="flex shrink-0 items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <NodeContextMenu
            node={node}
            onRequestRename={onStartRename}
            onRequestDelete={onRequestDelete}
            onRequestMove={onRequestMove}
            onCreated={onCreated}
          >
            <span className={ACTION_BUTTON} aria-hidden="true">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          </NodeContextMenu>
          {!canEdit ? null : isSpace ? (
            <button
              type="button"
              className={ACTION_BUTTON}
              aria-label={`New project in ${node.label}`}
              title="New project"
              onClick={() => create.project(node.id)}
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : (
            <AddPageMenu parentId={node.id} onCreated={onCreated}>
              <span className={ACTION_BUTTON} aria-hidden="true" title="Add page">
                <Plus className="h-4 w-4" />
              </span>
            </AddPageMenu>
          )}
        </span>
      ) : null}
    </div>
  )
}
