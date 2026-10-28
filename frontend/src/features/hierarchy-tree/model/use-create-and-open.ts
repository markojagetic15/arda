import { useNavigate } from 'react-router-dom'

import type { PageType } from '@/entities/hierarchy-node'

import { useCreatePage } from './use-create-page'
import { useCreateProject } from './use-create-project'
import { useCreateSpace } from './use-create-space'

const DEFAULT_TITLES: Record<PageType, string> = {
  document: 'Untitled document',
  canvas: 'Untitled canvas',
  kanban: 'Untitled board',
}

/**
 * Creation actions that land the user on the new thing: a new page opens
 * immediately, a new project opens its default document, and a brand-new
 * space comes with a first project so there's something to open.
 */
export function useCreateAndOpen(onCreated?: (parentId: string) => void) {
  const navigate = useNavigate()
  const createSpace = useCreateSpace()
  const createProject = useCreateProject()
  const createPage = useCreatePage()

  function page(parentId: string, type: PageType) {
    createPage.mutate(
      { parentId, type, title: DEFAULT_TITLES[type] },
      {
        onSuccess: (created) => {
          onCreated?.(parentId)
          navigate(`/workspace/${created.id}`)
        },
      },
    )
  }

  function project(spaceId: string, name = 'Untitled project') {
    createProject.mutate(
      { spaceId, name },
      {
        onSuccess: ({ project: created, pages }) => {
          onCreated?.(spaceId)
          onCreated?.(created.id)
          const first = pages.find((candidate) => candidate.pageType === 'document') ?? pages[0]
          if (first) navigate(`/workspace/${first.id}`)
        },
      },
    )
  }

  function space(name = 'New space', firstProjectName = 'First project') {
    createSpace.mutate({ name }, { onSuccess: (created) => project(created.id, firstProjectName) })
  }

  return {
    page,
    project,
    space,
    isPending: createSpace.isPending || createProject.isPending || createPage.isPending,
  }
}
