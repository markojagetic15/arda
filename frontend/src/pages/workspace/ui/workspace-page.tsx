import { Spinner } from '@heroui/react'
import { FileQuestion } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { useAuth } from '@/entities/session'
import { useHierarchyTree } from '@/features/hierarchy-tree'
import { colorForUserId } from '@/shared/lib/collaboration'
import { readLocal, writeLocal } from '@/shared/lib/storage/local'
import { rememberRecentPage } from '@/shared/lib/storage/recent-pages'
import { WorkspaceLayoutContext } from '@/shared/lib/workspace-layout'
import { AppSidebar } from '@/widgets/app-sidebar'
import { CommandPalette } from '@/widgets/command-palette'
import { DocumentPage } from '@/widgets/document-page'
import { EmailVerificationBanner } from '@/widgets/email-verification-banner'
import { KanbanBoard } from '@/widgets/kanban-board'
import { ShareDialog } from '@/widgets/share-dialog'

import { WorkspaceHome } from './workspace-home'

// The canvas library is large; load it only when a canvas page is opened.
const CanvasBoard = lazy(() => import('@/widgets/canvas-board').then((module) => ({ default: module.CanvasBoard })))

const SIDEBAR_KEY = 'proarda-sidebar-open'
const isSmallScreen = () => window.matchMedia('(max-width: 767px)').matches

export function WorkspacePage() {
  const { pageId } = useParams<{ pageId?: string }>()
  const location = useLocation()
  const { user } = useAuth()
  const { data, isPending } = useHierarchyTree()
  const [sidebarOpen, setSidebarOpen] = useState(() => !isSmallScreen() && readLocal(SIDEBAR_KEY, true))

  const currentPage = pageId ? data?.nodes.find((node) => node.id === pageId && node.kind === 'page') : undefined
  const awarenessUser = useMemo(
    () => (user ? { id: user.id, name: user.name, color: colorForUserId(user.id) } : null),
    [user],
  )

  useEffect(() => {
    if (currentPage) {
      rememberRecentPage(currentPage.id)
      document.title = `${currentPage.label} - proarda`
    } else {
      document.title = 'proarda'
    }
  }, [currentPage])

  // On phones the sidebar is an overlay - close it after navigating.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    if (isSmallScreen()) setSidebarOpen(false)
  }

  function setOpen(open: boolean) {
    setSidebarOpen(open)
    if (!isSmallScreen()) writeLocal(SIDEBAR_KEY, open)
  }

  const layout = useMemo(() => ({ sidebarOpen, openSidebar: () => setOpen(true) }), [sidebarOpen])

  let content
  if (isPending || !awarenessUser) {
    content = (
      <div className="flex h-full items-center justify-center">
        <Spinner size="sm" />
      </div>
    )
  } else if (!pageId) {
    content = <WorkspaceHome nodes={data?.nodes ?? []} />
  } else if (!currentPage) {
    content = (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <FileQuestion className="h-10 w-10 text-muted" />
        <p className="font-display text-xl font-bold">This page doesn't exist</p>
        <p className="text-sm text-muted">It may have been deleted, or the link is wrong.</p>
        <Link to="/workspace" className="mt-2 text-sm font-semibold text-accent hover:underline">
          Go to home
        </Link>
      </div>
    )
  } else if (currentPage.pageType === 'canvas') {
    content = (
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Spinner size="sm" />
          </div>
        }
      >
        <CanvasBoard key={pageId} pageId={pageId} user={awarenessUser} role={currentPage.role} />
      </Suspense>
    )
  } else if (currentPage.pageType === 'kanban') {
    content = <KanbanBoard key={pageId} pageId={pageId} user={awarenessUser} role={currentPage.role} />
  } else {
    content = <DocumentPage key={pageId} pageId={pageId} user={awarenessUser} role={currentPage.role} />
  }

  return (
    <WorkspaceLayoutContext.Provider value={layout}>
      <div className="flex h-screen overflow-hidden bg-background">
        {sidebarOpen ? (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <aside className="fixed inset-y-0 left-0 z-40 w-[272px] shrink-0 border-r border-border shadow-xl md:static md:shadow-none">
              <AppSidebar onCollapse={() => setOpen(false)} />
            </aside>
          </>
        ) : null}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {!pageId && !sidebarOpen ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute top-3 left-3 z-10 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm shadow-sm"
            >
              Menu
            </button>
          ) : null}
          <EmailVerificationBanner />
          <div className="min-h-0 flex-1">{content}</div>
        </main>
      </div>
      <CommandPalette />
      <ShareDialog />
    </WorkspaceLayoutContext.Provider>
  )
}
