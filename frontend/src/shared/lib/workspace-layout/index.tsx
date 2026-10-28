import { createContext, useContext } from 'react'

export interface WorkspaceLayoutValue {
  sidebarOpen: boolean
  openSidebar: () => void
}

export const WorkspaceLayoutContext = createContext<WorkspaceLayoutValue>({
  sidebarOpen: true,
  openSidebar: () => {},
})

export function useWorkspaceLayout(): WorkspaceLayoutValue {
  return useContext(WorkspaceLayoutContext)
}
