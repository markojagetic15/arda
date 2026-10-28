import { useRef, type MouseEvent } from 'react'
import type { Awareness } from 'y-protocols/awareness'

import type { AwarenessUser, CursorPosition } from '@/shared/lib/collaboration'

interface RemoteCursor {
  clientId: number
  user: AwarenessUser
  cursor: CursorPosition
}

interface LiveCursorCanvasProps {
  awareness: Awareness
  awarenessStates: Map<number, Record<string, unknown>>
  localClientId: number
}

export function LiveCursorCanvas({ awareness, awarenessStates, localClientId }: LiveCursorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    awareness.setLocalStateField('cursor', {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    } satisfies CursorPosition)
  }

  const handleMouseLeave = () => {
    awareness.setLocalStateField('cursor', null)
  }

  const remoteCursors: RemoteCursor[] = [...awarenessStates.entries()]
    .filter(([clientId]) => clientId !== localClientId)
    .map(([clientId, state]) => ({
      clientId,
      user: state.user as AwarenessUser,
      cursor: state.cursor as CursorPosition,
    }))
    .filter((entry): entry is RemoteCursor => Boolean(entry.user) && Boolean(entry.cursor))

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-80 w-full overflow-hidden rounded-lg border border-current/15 bg-current/[0.02]"
    >
      <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center text-sm opacity-40">
        Move your mouse here — everyone viewing this page sees your cursor live.
      </p>
      {remoteCursors.map(({ clientId, user, cursor }) => (
        <div
          key={clientId}
          className="pointer-events-none absolute flex -translate-x-1 -translate-y-1 items-center gap-1 transition-[left,top] duration-100 ease-linear"
          style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={user.color}>
            <path d="M1 1l5.5 13 2-5.5L14 6.5z" />
          </svg>
          <span
            className="rounded px-1.5 py-0.5 text-xs whitespace-nowrap text-white"
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </span>
        </div>
      ))}
    </div>
  )
}
