import { Link, useParams } from 'react-router-dom'

import { useAuth } from '@/entities/session'
import { useHierarchyTree } from '@/features/hierarchy-tree'
import { colorForUserId } from '@/shared/lib/collaboration'
import { CanvasBoard } from '@/widgets/canvas-board'
import { DocumentPage } from '@/widgets/document-page'
import { KanbanBoard } from '@/widgets/kanban-board'
import { PageCollaboration } from '@/widgets/page-collaboration'
import { SidebarTree } from '@/widgets/sidebar-tree'

export function WorkspacePage() {
  const { pageId } = useParams<{ pageId?: string }>()
  const { user } = useAuth()
  const { data } = useHierarchyTree()

  const currentPage = pageId ? data?.nodes.find((node) => node.id === pageId && node.kind === 'page') : undefined
  const awarenessUser = user ? { id: user.id, name: user.name, color: colorForUserId(user.id) } : null

  return (
    <div className="flex h-screen">
      <aside className="w-64 shrink-0 border-r border-current/10">
        <SidebarTree />
      </aside>
      <main className="flex-1 overflow-hidden">
        {pageId && awarenessUser && currentPage?.pageType === 'document' ? (
          <DocumentPage key={pageId} pageId={pageId} user={awarenessUser} />
        ) : pageId && awarenessUser && currentPage?.pageType === 'canvas' ? (
          <CanvasBoard key={pageId} pageId={pageId} user={awarenessUser} />
        ) : pageId && awarenessUser && currentPage?.pageType === 'kanban' ? (
          <KanbanBoard key={pageId} pageId={pageId} user={awarenessUser} />
        ) : pageId && awarenessUser ? (
          <div className="h-full overflow-y-auto p-8">
            <PageCollaboration key={pageId} pageId={pageId} user={awarenessUser} />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm opacity-60">Select a page from the sidebar, or create a space to get started.</p>
            <Link to="/profile" className="text-sm underline">
              Back to profile
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
