import { IconChevronDown, IconChevronRight } from '@heroui/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'

import { NodeContextMenu } from '@/features/hierarchy-tree'

import type { DropPosition } from '../lib/drop-target'
import type { FlatNode } from '../lib/flatten-tree'
import { DragHandleGlyph, NodeIcon } from './node-icon'
import { RenameInput } from './rename-input'

const INDENT_PX = 18

interface TreeRowProps {
  node: FlatNode
  isCollapsed: boolean
  isRenaming: boolean
  isSelected: boolean
  dropIndicator: DropPosition | null
  onToggleCollapse: () => void
  onSelectRow: () => void
  onStartRename: () => void
  onCommitRename: (label: string) => void
  onCancelRename: () => void
  onRequestDelete: () => void
  onRequestMove: () => void
}

export function TreeRow({
  node,
  isCollapsed,
  isRenaming,
  isSelected,
  dropIndicator,
  onToggleCollapse,
  onSelectRow,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onRequestDelete,
  onRequestMove,
}: TreeRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { node },
  })

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? undefined,
    paddingLeft: node.depth * INDENT_PX,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-1 rounded-md py-1 pr-1 hover:bg-current/5 ${
        isDragging ? 'opacity-40' : ''
      } ${isSelected ? 'bg-current/10' : ''} ${
        dropIndicator === 'inside' ? 'outline outline-2 outline-offset-[-2px] outline-blue-500' : ''
      }`}
    >
      {dropIndicator === 'before' ? (
        <div className="pointer-events-none absolute inset-x-2 top-0 h-0.5 -translate-y-px rounded bg-blue-500" />
      ) : null}
      {dropIndicator === 'after' ? (
        <div className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 translate-y-px rounded bg-blue-500" />
      ) : null}

      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="flex h-5 w-3 shrink-0 cursor-grab touch-none items-center justify-center opacity-0 group-hover:opacity-60"
      >
        <DragHandleGlyph className="h-3 w-3" />
      </button>

      {node.hasChildren ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleCollapse()
          }}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          className="flex h-5 w-4 shrink-0 items-center justify-center"
        >
          {isCollapsed ? <IconChevronRight className="h-3 w-3" /> : <IconChevronDown className="h-3 w-3" />}
        </button>
      ) : (
        <span className="w-4 shrink-0" />
      )}

      {isRenaming ? (
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <NodeIcon node={node} className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <RenameInput defaultValue={node.label} onCommit={onCommitRename} onCancel={onCancelRename} />
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelectRow}
          onDoubleClick={onStartRename}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <NodeIcon node={node} className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate text-sm">{node.label}</span>
        </button>
      )}

      {!isRenaming ? (
        <NodeContextMenu
          node={node}
          onRequestRename={onStartRename}
          onRequestDelete={onRequestDelete}
          onRequestMove={onRequestMove}
        >
          <span
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100"
          >
            ⋯
          </span>
        </NodeContextMenu>
      ) : null}
    </div>
  )
}
