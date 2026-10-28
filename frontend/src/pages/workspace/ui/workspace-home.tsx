import { ArrowRight, Clock, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getAncestry, NodeGlyph, PAGE_TYPES, spaceColor, type HierarchyNode } from '@/entities/hierarchy-node'
import { useAuth } from '@/entities/session'
import { useCreateAndOpen } from '@/features/hierarchy-tree'
import { getRecentPageIds } from '@/shared/lib/storage/recent-pages'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Working late'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function WorkspaceHome({ nodes }: { nodes: HierarchyNode[] }) {
  const { user } = useAuth()
  const create = useCreateAndOpen()
  const firstName = user?.name.split(' ')[0] ?? ''

  const byId = new Map(nodes.map((node) => [node.id, node]))
  const recent = getRecentPageIds()
    .map((id) => byId.get(id))
    .filter((node): node is HierarchyNode => Boolean(node))
    .slice(0, 6)
  const spaces = nodes.filter((node) => node.kind === 'space').sort((a, b) => a.position - b.position)
  const projects = nodes.filter((node) => node.kind === 'project')
  const targetProject = (recent[0] && getAncestry(nodes, recent[0].id).find((node) => node.kind === 'project')) ?? projects[0]

  if (spaces.length === 0) {
    return (
      <div className="bg-grid flex h-full items-center justify-center p-6">
        <div className="max-w-md text-center animate-rise">
          <span className="brand-gradient mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg">
            <Sparkles className="h-6 w-6" />
          </span>
          <h1 className="font-display mt-6 text-3xl font-bold">Welcome to proarda{firstName ? `, ${firstName}` : ''}</h1>
          <p className="mt-3 text-muted">
            Start with a space. We'll add a first project with a document, a canvas and a board so you can dive
            right in.
          </p>
          <button
            type="button"
            disabled={create.isPending}
            onClick={() => create.space('My workspace', 'Getting started')}
            className="brand-gradient mt-8 inline-flex h-11 items-center gap-2 rounded-xl px-6 font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            Create my workspace <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="scroll-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <h1 className="font-display text-3xl font-bold animate-rise">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1.5 text-muted">Here's what's happening in your workspace.</p>

        {targetProject ? (
          <section className="mt-10">
            <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">
              Create in {targetProject.label}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {PAGE_TYPES.map(({ type, label, description, icon: Icon, tile }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => create.page(targetProject.id, type)}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">New {label.toLowerCase()}</span>
                    <span className="block text-xs text-muted">{description}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase">
            <Clock className="h-3.5 w-3.5" /> Recently visited
          </h2>
          {recent.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              Pages you open will show up here.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((page) => {
                const path = getAncestry(nodes, page.id).slice(0, -1)
                return (
                  <Link
                    key={page.id}
                    to={`/workspace/${page.id}`}
                    className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                  >
                    <NodeGlyph node={page} className="h-5 w-5" />
                    <span>
                      <span className="block truncate font-semibold">{page.label}</span>
                      <span className="block truncate text-xs text-muted">
                        {path.map((node) => node.label).join(' / ')}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Spaces</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {spaces.map((space) => {
              const spaceProjects = projects.filter((project) => project.parentId === space.id)
              const pageCount = nodes.filter(
                (node) => node.kind === 'page' && getAncestry(nodes, node.id)[0]?.id === space.id,
              ).length
              return (
                <div key={space.id} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: spaceColor(space.id) }}
                    >
                      {space.label.trim()[0]?.toUpperCase()}
                    </span>
                    <span>
                      <span className="block font-semibold">{space.label}</span>
                      <span className="block text-xs text-muted">
                        {spaceProjects.length} {spaceProjects.length === 1 ? 'project' : 'projects'} · {pageCount}{' '}
                        {pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {spaceProjects.map((project) => (
                      <span
                        key={project.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface-secondary px-2 py-1 text-xs"
                      >
                        <NodeGlyph node={project} className="h-3.5 w-3.5" /> {project.label}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => create.project(space.id)}
                      className="rounded-lg border border-dashed border-border px-2 py-1 text-xs text-muted hover:border-accent hover:text-accent"
                    >
                      + New project
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
