import { Folder, FolderOpen } from 'lucide-react'

import { pageTypeMeta, spaceColor } from '../lib/meta'
import type { HierarchyNode } from '../model/types'

interface NodeGlyphProps {
  node: Pick<HierarchyNode, 'id' | 'kind' | 'label' | 'pageType'>
  isOpen?: boolean
  className?: string
}

/** The icon shown for a node anywhere in the app: letter tile for spaces, folder for projects, typed icon for pages. */
export function NodeGlyph({ node, isOpen, className = 'h-4 w-4' }: NodeGlyphProps) {
  if (node.kind === 'space') {
    return (
      <span
        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] text-[10px] font-bold text-white"
        style={{ backgroundColor: spaceColor(node.id) }}
        aria-hidden="true"
      >
        {node.label.trim()[0]?.toUpperCase() ?? 'S'}
      </span>
    )
  }
  if (node.kind === 'project') {
    const Icon = isOpen ? FolderOpen : Folder
    return <Icon className={`${className} shrink-0 text-muted`} aria-hidden="true" />
  }
  const meta = pageTypeMeta(node.pageType)
  const Icon = meta.icon
  return <Icon className={`${className} shrink-0 ${meta.color}`} aria-hidden="true" />
}
