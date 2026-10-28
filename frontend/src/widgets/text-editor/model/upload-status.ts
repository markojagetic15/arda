import { useSyncExternalStore } from 'react'

interface UploadStatus {
  pending: number
  error: string | null
}

let status: UploadStatus = { pending: 0, error: null }
const listeners = new Set<() => void>()

function set(next: UploadStatus) {
  status = next
  listeners.forEach((listener) => listener())
}

/** Image uploads in progress and the last failure, shown under the document toolbar. */
export const uploadStatus = {
  start: () => set({ pending: status.pending + 1, error: null }),
  done: () => set({ ...status, pending: Math.max(0, status.pending - 1) }),
  fail: (error: string) => set({ pending: Math.max(0, status.pending - 1), error }),
  dismiss: () => set({ ...status, error: null }),
}

export function useUploadStatus(): UploadStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => status,
  )
}
