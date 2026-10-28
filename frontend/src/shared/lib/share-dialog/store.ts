import { useSyncExternalStore } from 'react'

export interface ShareTarget {
  type: 'space' | 'project' | 'page'
  id: string
}

let target: ShareTarget | null = null
const listeners = new Set<() => void>()

export const shareDialog = {
  open: (next: ShareTarget) => {
    target = next
    listeners.forEach((listener) => listener())
  },
  close: () => {
    target = null
    listeners.forEach((listener) => listener())
  },
}

export function useShareTarget(): ShareTarget | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => target,
  )
}
