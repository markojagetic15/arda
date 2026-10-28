import { ArrowUpRight, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { NodeGlyph } from '@/entities/hierarchy-node'

import { useHierarchyTree } from '../model/use-hierarchy-tree'

interface PageLinkChipProps {
  pageId: string
  className?: string
  /** Rendered inside an editor selection - draws a ring instead of navigating on single click. */
  selected?: boolean
}

/**
 * A link to another page, shown as a chip with the page's icon and live
 * title. Pages the viewer can't open (no access, or deleted) show as
 * restricted instead of leaking their title.
 */
export function PageLinkChip({ pageId, className = '', selected }: PageLinkChipProps) {
  const { data } = useHierarchyTree()
  const navigate = useNavigate()
  const page = data?.nodes.find((node) => node.id === pageId && node.kind === 'page')

  return (
    <span
      role="link"
      tabIndex={0}
      contentEditable={false}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (page) navigate(`/workspace/${page.id}`)
      }}
      onKeyDown={(event) => event.key === 'Enter' && page && navigate(`/workspace/${page.id}`)}
      title={page ? `Open ${page.label}` : "You don't have access to this page"}
      className={`inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md border px-1.5 py-px align-baseline text-[0.92em] leading-snug font-medium no-underline transition-colors select-none ${
        page
          ? 'border-border bg-surface-secondary text-foreground hover:border-accent/50 hover:bg-accent-soft'
          : 'border-dashed border-border text-muted'
      } ${selected ? 'ring-2 ring-accent' : ''} ${className}`}
    >
      {page ? <NodeGlyph node={page} className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
      <span className="truncate">{page ? page.label : 'Restricted page'}</span>
      {page ? <ArrowUpRight className="h-3 w-3 shrink-0 text-muted" /> : null}
    </span>
  )
}
