import { Dropdown } from '@heroui/react'
import type { ReactNode } from 'react'

import type { HierarchyNode } from '@/entities/hierarchy-node'

import { useCreatePage } from '../model/use-create-page'
import { useCreateProject } from '../model/use-create-project'
import { useDuplicateNode } from '../model/use-duplicate-node'

interface NodeContextMenuProps {
  node: HierarchyNode
  children: ReactNode
  onRequestRename: () => void
  onRequestDelete: () => void
  onRequestMove: () => void
}

export function NodeContextMenu({
  node,
  children,
  onRequestRename,
  onRequestDelete,
  onRequestMove,
}: NodeContextMenuProps) {
  const createProject = useCreateProject()
  const createPage = useCreatePage()
  const duplicateNode = useDuplicateNode()

  const canDuplicate = node.kind === 'project' || node.kind === 'page'
  const canMove = node.kind === 'project' || node.kind === 'page'

  const handleCreateChild = () => {
    if (node.kind === 'space') {
      createProject.mutate({ spaceId: node.id, name: 'Untitled project' })
    } else {
      createPage.mutate({ parentId: node.id, title: 'Untitled' })
    }
  }

  const handleDuplicate = () => {
    if (node.kind === 'project' || node.kind === 'page') {
      duplicateNode.mutate({ id: node.id, kind: node.kind })
    }
  }

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label={`More actions for ${node.label}`}>{children}</Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu aria-label={`Actions for ${node.label}`}>
          <Dropdown.Item id="create" onAction={handleCreateChild}>
            {node.kind === 'space' ? 'New project' : 'New page'}
          </Dropdown.Item>
          <Dropdown.Item id="rename" onAction={onRequestRename}>
            Rename
          </Dropdown.Item>
          {canDuplicate ? (
            <Dropdown.Item id="duplicate" onAction={handleDuplicate}>
              Duplicate
            </Dropdown.Item>
          ) : null}
          {canMove ? (
            <Dropdown.Item id="move" onAction={onRequestMove}>
              Move to…
            </Dropdown.Item>
          ) : null}
          <Dropdown.Item id="delete" onAction={onRequestDelete}>
            Delete
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
