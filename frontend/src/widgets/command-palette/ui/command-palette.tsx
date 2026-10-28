import { CornerDownLeft, FolderPlus, Home, Moon, Plus, Search, Sun, UserRound, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { getAncestry, NodeGlyph, PAGE_TYPES, type HierarchyNode } from '@/entities/hierarchy-node'
import { useCreateAndOpen, useHierarchyTree } from '@/features/hierarchy-tree'
import { commandPalette, useCommandPaletteOpen } from '@/shared/lib/command-palette/store'
import { getRecentPageIds } from '@/shared/lib/storage/recent-pages'
import { useTheme } from '@/shared/lib/theme'

interface Command {
  id: string
  label: string
  hint?: string
  group: string
  icon: ReactNode
  run: () => void
}

function iconOf(Icon: LucideIcon) {
  return <Icon className="h-4 w-4 text-muted" />
}

/** Ctrl/Cmd+K: jump to any page or run a quick action. */
export function CommandPalette() {
  const isOpen = useCommandPaletteOpen()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        commandPalette.toggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return isOpen ? <PaletteDialog /> : null
}

function PaletteDialog() {
  const navigate = useNavigate()
  const { data } = useHierarchyTree()
  const { resolvedTheme, setPreference } = useTheme()
  const create = useCreateAndOpen()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  const commands = useMemo<Command[]>(() => {
    const nodes = data?.nodes ?? []
    const close = (fn: () => void) => () => {
      commandPalette.close()
      fn()
    }
    const pathOf = (node: HierarchyNode) =>
      getAncestry(nodes, node.id)
        .slice(0, -1)
        .map((ancestor) => ancestor.label)
        .join(' / ')

    const recentIds = getRecentPageIds()
    const pages = nodes
      .filter((node) => node.kind === 'page')
      .sort((a, b) => {
        const ra = recentIds.indexOf(a.id)
        const rb = recentIds.indexOf(b.id)
        return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb) || a.label.localeCompare(b.label)
      })

    const firstProject = nodes.find((node) => node.kind === 'project')
    const firstSpace = nodes.find((node) => node.kind === 'space')

    return [
      ...pages.map((page) => ({
        id: page.id,
        label: page.label,
        hint: pathOf(page),
        group: 'Pages',
        icon: <NodeGlyph node={page} />,
        run: close(() => navigate(`/workspace/${page.id}`)),
      })),
      ...(firstProject
        ? PAGE_TYPES.map(({ type, label, icon }) => ({
            id: `new-${type}`,
            label: `New ${label.toLowerCase()}`,
            hint: `in ${firstProject.label}`,
            group: 'Create',
            icon: iconOf(icon),
            run: close(() => create.page(firstProject.id, type)),
          }))
        : []),
      ...(firstSpace
        ? [
            {
              id: 'new-project',
              label: 'New project',
              hint: `in ${firstSpace.label}`,
              group: 'Create',
              icon: iconOf(FolderPlus),
              run: close(() => create.project(firstSpace.id)),
            },
          ]
        : []),
      {
        id: 'new-space',
        label: 'New space',
        group: 'Create',
        icon: iconOf(Plus),
        run: close(() => create.space()),
      },
      { id: 'home', label: 'Go to home', group: 'Navigate', icon: iconOf(Home), run: close(() => navigate('/workspace')) },
      {
        id: 'profile',
        label: 'Profile & settings',
        group: 'Navigate',
        icon: iconOf(UserRound),
        run: close(() => navigate('/profile')),
      },
      {
        id: 'theme',
        label: resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        group: 'Preferences',
        icon: iconOf(resolvedTheme === 'dark' ? Sun : Moon),
        run: close(() => setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')),
      },
    ]
  }, [data, navigate, create, resolvedTheme, setPreference])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return commands
    return commands.filter((command) => `${command.label} ${command.hint ?? ''}`.toLowerCase().includes(needle))
  }, [commands, query])

  const activeIndex = Math.min(active, Math.max(filtered.length - 1, 0))

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      filtered[activeIndex]?.run()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      commandPalette.close()
    }
  }

  let lastGroup = ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-[2px] animate-fade-in"
      onMouseDown={(event) => event.target === event.currentTarget && commandPalette.close()}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="app-shadow-lg w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-overlay animate-rise"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            placeholder="Search pages or type a command..."
            aria-label="Search"
            className="h-13 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          <kbd className="rounded border border-border px-1.5 text-[10px] text-muted">Esc</kbd>
        </div>

        <div ref={listRef} className="scroll-thin max-h-[52vh] overflow-y-auto p-2" role="listbox">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">Nothing matches "{query}".</p>
          ) : (
            filtered.map((command, index) => {
              const header = command.group !== lastGroup ? command.group : null
              lastGroup = command.group
              const selected = index === activeIndex
              return (
                <div key={command.id}>
                  {header ? (
                    <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">
                      {header}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={command.run}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                      selected ? 'bg-accent-soft text-foreground' : ''
                    }`}
                  >
                    {command.icon}
                    <span className="truncate font-medium">{command.label}</span>
                    {command.hint ? <span className="truncate text-xs text-muted">{command.hint}</span> : null}
                    {selected ? <CornerDownLeft className="ml-auto h-3.5 w-3.5 shrink-0 text-muted" /> : null}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
