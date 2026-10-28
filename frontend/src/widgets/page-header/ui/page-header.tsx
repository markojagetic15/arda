import { Check, ChevronRight, Eye, Link2, MessageSquare, PanelLeftOpen, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { getAncestry, hasRole, NodeGlyph, pageUrl } from '@/entities/hierarchy-node'
import { useHierarchyTree, useRenameNode } from '@/features/hierarchy-tree'
import { shareDialog } from '@/shared/lib/share-dialog/store'
import { useWorkspaceLayout } from '@/shared/lib/workspace-layout'
import { copyText } from '@/shared/lib/clipboard'

interface PageHeaderProps {
  pageId: string
  /** Right-aligned area: presence, status, page actions. */
  children?: ReactNode
}

/** Breadcrumbs (space / project / ... / page) with an inline-renamable page title. */
export function PageHeader({ pageId, children }: PageHeaderProps) {
  const { data } = useHierarchyTree()
  const renameNode = useRenameNode()
  const { sidebarOpen, openSidebar } = useWorkspaceLayout()
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const chain = data ? getAncestry(data.nodes, pageId) : []
  const page = chain.at(-1)
  const ancestors = chain.slice(0, -1)
  const canEdit = hasRole(page?.role, 'edit')

  function commit(value: string) {
    setEditing(false)
    const label = value.trim()
    if (page && label && label !== page.label) renameNode.mutate({ id: page.id, kind: 'page', label })
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      {!sidebarOpen ? (
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Show sidebar"
          title="Show sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-default hover:text-foreground"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      ) : null}

      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
        {ancestors.map((node) => (
          <span key={node.id} className="hidden min-w-0 items-center gap-1 text-muted md:flex">
            <span className="truncate">{node.label}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </span>
        ))}
        {page ? (
          <span className="flex min-w-0 items-center gap-2">
            <NodeGlyph node={page} />
            {editing && canEdit ? (
              <input
                autoFocus
                defaultValue={page.label}
                aria-label="Page title"
                onBlur={(event) => commit(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commit(event.currentTarget.value)
                  if (event.key === 'Escape') setEditing(false)
                }}
                className="h-7 min-w-40 rounded-md border border-accent bg-field px-2 font-semibold outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => canEdit && setEditing(true)}
                title={canEdit ? 'Rename' : undefined}
                className={`truncate rounded-md px-1 py-0.5 font-semibold ${canEdit ? 'hover:bg-default' : 'cursor-default'}`}
              >
                {page.label}
              </button>
            )}
          </span>
        ) : null}
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        {page && !canEdit ? (
          <span className="hidden items-center gap-1.5 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-muted sm:inline-flex">
            {page.role === 'comment' ? <MessageSquare className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {page.role === 'comment' ? 'Can comment' : 'View only'}
          </span>
        ) : null}
        {children}
        <button
          type="button"
          title="Copy link - paste it into a document, card or canvas to link this page"
          aria-label="Copy link"
          onClick={() => {
            void copyText(pageUrl(pageId))
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-default hover:text-foreground"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => shareDialog.open({ type: 'page', id: pageId })}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </header>
  )
}
