import { httpClient } from '@/shared/api/http-client'

import type { HierarchyNode, NodeKind, PageType } from '../model/types'

export const hierarchyApi = {
  getTree: () => httpClient.get<{ nodes: HierarchyNode[] }>('/hierarchy/tree'),

  createSpace: (input: { name: string }) => httpClient.post<HierarchyNode>('/hierarchy/spaces', input),

  createProject: (input: { spaceId: string; name: string }) =>
    httpClient.post<{ project: HierarchyNode; pages: HierarchyNode[] }>('/hierarchy/projects', input),

  createPage: (input: { parentId: string; title?: string; type?: PageType }) =>
    httpClient.post<HierarchyNode>('/hierarchy/pages', input),

  rename: (input: { id: string; kind: NodeKind; label: string }) =>
    httpClient.patch<HierarchyNode>(`/hierarchy/nodes/${input.id}/rename`, {
      kind: input.kind,
      label: input.label,
    }),

  move: (input: { id: string; kind: NodeKind; targetParentId: string | null; index: number }) =>
    httpClient.patch<HierarchyNode>(`/hierarchy/nodes/${input.id}/move`, {
      kind: input.kind,
      targetParentId: input.targetParentId,
      index: input.index,
    }),

  duplicate: (input: { id: string; kind: 'project' | 'page' }) =>
    httpClient.post<{ nodes: HierarchyNode[] }>(`/hierarchy/nodes/${input.id}/duplicate`, {
      kind: input.kind,
    }),

  delete: (input: { id: string; kind: NodeKind }) =>
    httpClient.delete<void>(`/hierarchy/nodes/${input.id}?kind=${input.kind}`),
}
