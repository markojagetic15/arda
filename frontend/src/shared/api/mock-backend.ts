import type { HierarchyNode, PageType } from '@/entities/hierarchy-node'
import type { User } from '@/entities/user'

/**
 * A tiny in-memory stand-in for the real backend, used when
 * `VITE_MOCK_AUTH=true` (see `http-client.ts`). Lets the app be explored - * spaces, projects, the default document/canvas/kanban pages, drag-and-drop
 * reordering - with no Postgres/Redis/NestJS running at all.
 *
 * Real-time collaboration itself still needs the real WebSocket gateway, so
 * pages will show "Disconnected" and won't sync across tabs - everything
 * else (editing, drawing, dragging cards) still works fully locally.
 */

const MOCK_USER: User = {
  id: 'mock-user',
  email: 'demo@proarda.local',
  name: 'Demo User',
  emailVerified: true,
  createdAt: new Date(0).toISOString(),
}

let nextId = 1
function generateId(prefix: string): string {
  return `mock-${prefix}-${nextId++}`
}

const nodes: HierarchyNode[] = []

function nextPosition(parentId: string | null): number {
  const siblings = nodes.filter((node) => node.parentId === parentId)
  return siblings.length === 0 ? 1000 : Math.max(...siblings.map((node) => node.position)) + 1000
}

function createDefaultPages(projectId: string): HierarchyNode[] {
  const pages: { label: string; pageType: PageType }[] = [
    { label: 'Document', pageType: 'document' },
    { label: 'Canvas', pageType: 'canvas' },
    { label: 'Board', pageType: 'kanban' },
  ]
  return pages.map(({ label, pageType }) => {
    const page: HierarchyNode = {
      id: generateId('page'),
      kind: 'page',
      label,
      parentId: projectId,
      position: nextPosition(projectId),
      pageType,
    }
    nodes.push(page)
    return page
  })
}

function seed(): void {
  const space: HierarchyNode = {
    id: generateId('space'),
    kind: 'space',
    label: 'My Space',
    parentId: null,
    position: nextPosition(null),
  }
  nodes.push(space)

  const project: HierarchyNode = {
    id: generateId('project'),
    kind: 'project',
    label: 'Getting Started',
    parentId: space.id,
    position: nextPosition(space.id),
  }
  nodes.push(project)
  createDefaultPages(project.id)
}
seed()

function collectSubtreeIds(rootId: string): Set<string> {
  const ids = new Set<string>([rootId])
  const queue = [rootId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const node of nodes) {
      if (node.parentId === current && !ids.has(node.id)) {
        ids.add(node.id)
        queue.push(node.id)
      }
    }
  }
  return ids
}

function parseBody(init: RequestInit | undefined): Record<string, unknown> {
  if (!init?.body || typeof init.body !== 'string') return {}
  return JSON.parse(init.body) as Record<string, unknown>
}

export type MockResult = { handled: true; data: unknown } | { handled: false }

export function handleMockRequest(path: string, init?: RequestInit): MockResult {
  const method = init?.method ?? 'GET'
  const body = parseBody(init)

  if (path === '/auth/refresh' && method === 'POST') {
    return { handled: true, data: { user: MOCK_USER, accessToken: 'mock-token' } }
  }

  if (path === '/users/me' && method === 'GET') {
    return { handled: true, data: MOCK_USER }
  }

  if (path === '/users/me' && method === 'PATCH') {
    if (typeof body.name === 'string') MOCK_USER.name = body.name
    return { handled: true, data: MOCK_USER }
  }

  if (path === '/hierarchy/tree' && method === 'GET') {
    return { handled: true, data: { nodes: [...nodes] } }
  }

  if (path === '/hierarchy/spaces' && method === 'POST') {
    const space: HierarchyNode = {
      id: generateId('space'),
      kind: 'space',
      label: (body.name as string) || 'Untitled space',
      parentId: null,
      position: nextPosition(null),
    }
    nodes.push(space)
    return { handled: true, data: space }
  }

  if (path === '/hierarchy/projects' && method === 'POST') {
    const spaceId = body.spaceId as string
    const project: HierarchyNode = {
      id: generateId('project'),
      kind: 'project',
      label: (body.name as string) || 'Untitled project',
      parentId: spaceId,
      position: nextPosition(spaceId),
    }
    nodes.push(project)
    const pages = createDefaultPages(project.id)
    return { handled: true, data: { project, pages } }
  }

  if (path === '/hierarchy/pages' && method === 'POST') {
    const parentId = body.parentId as string
    const page: HierarchyNode = {
      id: generateId('page'),
      kind: 'page',
      label: (body.title as string) || 'Untitled',
      parentId,
      position: nextPosition(parentId),
      pageType: (body.type as PageType) ?? 'document',
    }
    nodes.push(page)
    return { handled: true, data: page }
  }

  const renameMatch = /^\/hierarchy\/nodes\/([^/]+)\/rename$/.exec(path)
  if (renameMatch && method === 'PATCH') {
    const node = nodes.find((candidate) => candidate.id === renameMatch[1])
    if (node) node.label = body.label as string
    return { handled: true, data: node }
  }

  const moveMatch = /^\/hierarchy\/nodes\/([^/]+)\/move$/.exec(path)
  if (moveMatch && method === 'PATCH') {
    const node = nodes.find((candidate) => candidate.id === moveMatch[1])
    if (node) {
      const targetParentId = body.targetParentId as string | null
      const index = body.index as number
      const siblings = nodes
        .filter((candidate) => candidate.parentId === targetParentId && candidate.id !== node.id)
        .sort((a, b) => a.position - b.position)
      const before = siblings[index - 1]?.position
      const after = siblings[index]?.position
      node.parentId = targetParentId
      node.position = before === undefined ? (after === undefined ? 1000 : after / 2) : after === undefined ? before + 1000 : (before + after) / 2
    }
    return { handled: true, data: node }
  }

  const duplicateMatch = /^\/hierarchy\/nodes\/([^/]+)\/duplicate$/.exec(path)
  if (duplicateMatch && method === 'POST') {
    const sourceId = duplicateMatch[1]
    const source = nodes.find((candidate) => candidate.id === sourceId)
    if (!source) return { handled: true, data: { nodes: [] } }

    const idMap = new Map<string, string>()
    const subtreeIds = collectSubtreeIds(sourceId)
    const created: HierarchyNode[] = []
    for (const original of nodes.filter((node) => subtreeIds.has(node.id))) {
      const newId = generateId(original.kind)
      idMap.set(original.id, newId)
      const parentId = original.id === sourceId ? original.parentId : (idMap.get(original.parentId ?? '') ?? original.parentId)
      const copy: HierarchyNode = {
        ...original,
        id: newId,
        parentId,
        label: original.id === sourceId ? `${original.label} (copy)` : original.label,
        position: original.id === sourceId ? nextPosition(original.parentId) : original.position,
      }
      nodes.push(copy)
      created.push(copy)
    }
    return { handled: true, data: { nodes: created } }
  }

  const deleteMatch = /^\/hierarchy\/nodes\/([^/]+)\?kind=(\w+)$/.exec(path)
  if (deleteMatch && method === 'DELETE') {
    const idsToRemove = collectSubtreeIds(deleteMatch[1])
    for (const id of idsToRemove) {
      const index = nodes.findIndex((node) => node.id === id)
      if (index !== -1) nodes.splice(index, 1)
    }
    return { handled: true, data: undefined }
  }

  return { handled: false }
}
