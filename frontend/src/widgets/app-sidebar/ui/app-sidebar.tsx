import { Home, PanelLeftClose, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { commandPalette } from '@/shared/lib/command-palette/store'
import { Logo } from '@/shared/ui/logo'
import { SidebarTree } from '@/widgets/sidebar-tree'

import { UserMenu } from './user-menu'

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

interface AppSidebarProps {
  onCollapse: () => void
}

export function AppSidebar({ onCollapse }: AppSidebarProps) {
  const location = useLocation()
  const onHome = location.pathname === '/workspace'

  return (
    <div className="flex h-full flex-col bg-[var(--app-sidebar)]">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <Link to="/workspace" aria-label="Workspace home">
          <Logo markClassName="h-6 w-6" />
        </Link>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Hide sidebar"
          title="Hide sidebar"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-default hover:text-foreground"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5 px-2 pb-3">
        <button
          type="button"
          onClick={commandPalette.open}
          className="mb-1 flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-sm text-muted shadow-xs hover:border-border-secondary hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="rounded border border-border px-1.5 font-sans text-[10px] font-medium">
            {IS_MAC ? '⌘' : 'Ctrl'} K
          </kbd>
        </button>
        <Link
          to="/workspace"
          className={`flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm ${
            onHome ? 'bg-accent-soft font-medium text-accent' : 'text-foreground/85 hover:bg-default/70'
          }`}
        >
          <Home className="h-4 w-4" /> Home
        </Link>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto border-t border-border/70 pt-3">
        <SidebarTree />
      </div>

      <div className="shrink-0 border-t border-border/70 p-2">
        <UserMenu />
      </div>
    </div>
  )
}
