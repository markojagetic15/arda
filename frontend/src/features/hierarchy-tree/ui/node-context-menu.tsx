import { Dropdown } from '@heroui/react'
import { Copy, FolderInput, FolderPlus, Link2, Pencil, Trash2, UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'

import { hasRole, PAGE_TYPES, pageUrl, type HierarchyNode } from '@/entities/hierarchy-node'
import { shareDialog } from '@/shared/lib/share-dialog/store'
import { copyText } from '@/shared/lib/clipboard'

import { useCreateAndOpen } from '../model/use-create-and-open'
import { useDuplicateNode } from '../model/use-duplicate-node'

interface NodeContextMenuProps {
  node: HierarchyNode
  children: ReactNode
  onRequestRename: () => void
  onRequestDelete: () => void
  onRequestMove: () => void
  onCreated?: (parentId: string) => void
}

const ITEM = 'flex items-center gap-2.5'
const ICON = 'h-4 w-4 text-muted'

export function NodeContextMenu({
  node,
  children,
  onRequestRename,
  onRequestDelete,
  onRequestMove,
  onCreated,
}: NodeContextMenuProps) {
  const create = useCreateAndOpen(onCreated)
  const duplicateNode = useDuplicateNode()
  const canEdit = hasRole(node.role, 'edit')
  // Deleting a whole space is reserved for people with full access.
  const canDelete = node.kind === 'space' ? hasRole(node.role, 'full') : canEdit
  const canDuplicateOrMove = canEdit && (node.kind === 'project' || node.kind === 'page')

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label={`More actions for ${node.label}`}>{children}</Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" className="min-w-52">
        <Dropdown.Menu aria-label={`Actions for ${node.label}`}>
          <Dropdown.Section>
            <Dropdown.Item id="share" textValue="Share" onAction={() => shareDialog.open({ type: node.kind, id: node.id })}>
              <span className={ITEM}>
                <UserPlus className={ICON} /> Share...
              </span>
            </Dropdown.Item>
            {node.kind === 'page' ? (
              <Dropdown.Item
                id="copy-link"
                textValue="Copy link"
                onAction={() => void copyText(pageUrl(node.id))}
              >
                <span className={ITEM}>
                  <Link2 className={ICON} /> Copy link
                </span>
              </Dropdown.Item>
            ) : null}
          </Dropdown.Section>
          {canEdit ? (
            <Dropdown.Section>
              {node.kind === 'space' ? (
                <Dropdown.Item id="new-project" textValue="New project" onAction={() => create.project(node.id)}>
                  <span className={ITEM}>
                    <FolderPlus className={ICON} /> New project
                  </span>
                </Dropdown.Item>
              ) : (
                PAGE_TYPES.map(({ type, label, icon: Icon, color }) => (
                  <Dropdown.Item key={type} id={`new-${type}`} textValue={`New ${label}`} onAction={() => create.page(node.id, type)}>
                    <span className={ITEM}>
                      <Icon className={`h-4 w-4 ${color}`} /> New {label.toLowerCase()}
                    </span>
                  </Dropdown.Item>
                ))
              )}
            </Dropdown.Section>
          ) : null}
          {canEdit ? (
            <Dropdown.Section>
              <Dropdown.Item id="rename" textValue="Rename" onAction={onRequestRename}>
                <span className={ITEM}>
                  <Pencil className={ICON} /> Rename
                </span>
              </Dropdown.Item>
              {canDuplicateOrMove ? (
                <Dropdown.Item
                  id="duplicate"
                  textValue="Duplicate"
                  onAction={() => duplicateNode.mutate({ id: node.id, kind: node.kind as 'project' | 'page' })}
                >
                  <span className={ITEM}>
                    <Copy className={ICON} /> Duplicate
                  </span>
                </Dropdown.Item>
              ) : null}
              {canDuplicateOrMove ? (
                <Dropdown.Item id="move" textValue="Move to" onAction={onRequestMove}>
                  <span className={ITEM}>
                    <FolderInput className={ICON} /> Move to...
                  </span>
                </Dropdown.Item>
              ) : null}
            </Dropdown.Section>
          ) : null}
          {canDelete ? (
            <Dropdown.Section>
              <Dropdown.Item id="delete" textValue="Delete" variant="danger" onAction={onRequestDelete}>
                <span className={ITEM}>
                  <Trash2 className="h-4 w-4" /> Delete
                </span>
              </Dropdown.Item>
            </Dropdown.Section>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
