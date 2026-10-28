import { useSyncExternalStore } from 'react'

let open = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export const commandPalette = {
  open: () => {
    open = true
    emit()
  },
  close: () => {
    open = false
    emit()
  },
  toggle: () => {
    open = !open
    emit()
  },
}

export function useCommandPaletteOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => open,
  )
}
