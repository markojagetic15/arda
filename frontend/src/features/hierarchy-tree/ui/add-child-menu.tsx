import { Dropdown } from '@heroui/react'
import type { ReactNode } from 'react'

import { PAGE_TYPES } from '@/entities/hierarchy-node'

import { useCreateAndOpen } from '../model/use-create-and-open'

interface AddChildMenuProps {
  parentId: string
  children: ReactNode
  onCreated?: (parentId: string) => void
}

/** "+" picker for a new page of a chosen type under a project or page. */
export function AddPageMenu({ parentId, children, onCreated }: AddChildMenuProps) {
  const create = useCreateAndOpen(onCreated)

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label="Add a page">{children}</Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" className="min-w-60">
        <Dropdown.Menu aria-label="Page type">
          {PAGE_TYPES.map(({ type, label, description, icon: Icon, tile }) => (
            <Dropdown.Item key={type} id={type} textValue={label} onAction={() => create.page(parentId, type)}>
              <span className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tile}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted">{description}</span>
                </span>
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
