import { sceneCoordsToViewportCoords } from '@excalidraw/excalidraw'

import type { PeerPresence } from '@/widgets/page-collaboration'

import type { ViewState } from './canvas-comment-overlay'

export interface PeerCanvasState {
  peer: PeerPresence
  pointer: { x: number; y: number } | null
  selectedIds: string[]
}

/**
 * Other people's pointers and selections on the canvas, drawn in each
 * person's page color (Excalidraw's built-in collaborator layer derives its
 * own pastel colors from the user id and ignores the ones passed in).
 */
export function CanvasCursors({ view, peers }: { view: ViewState; peers: PeerCanvasState[] }) {
  // Zero offsets give coordinates relative to the canvas container, which this overlay fills.
  const toView = (sceneX: number, sceneY: number) =>
    sceneCoordsToViewportCoords({ sceneX, sceneY }, { ...view, offsetLeft: 0, offsetTop: 0 })
  const zoom = view.zoom.value

  return (
    <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
      {peers.flatMap(({ peer, selectedIds }) =>
        view.elements
          .filter((element) => selectedIds.includes(element.id) && !element.isDeleted)
          .map((element) => {
            const x = Math.min(element.x, element.x + element.width)
            const y = Math.min(element.y, element.y + element.height)
            const topLeft = toView(x, y)
            return (
              <div
                key={`${peer.clientId}:${element.id}`}
                className="absolute rounded-sm border-2 border-dashed"
                style={{
                  left: topLeft.x - 4,
                  top: topLeft.y - 4,
                  width: Math.abs(element.width) * zoom + 8,
                  height: Math.abs(element.height) * zoom + 8,
                  borderColor: peer.color,
                }}
              />
            )
          }),
      )}
      {peers.map(({ peer, pointer }) => {
        if (!pointer) return null
        const at = toView(pointer.x, pointer.y)
        return (
          <div
            key={peer.clientId}
            className="absolute transition-[left,top] duration-75 ease-linear"
            style={{ left: at.x, top: at.y }}
          >
            <svg width="18" height="20" viewBox="0 0 18 20" className="drop-shadow" aria-hidden="true">
              <path d="M1 1 L1 16 L5.5 12 L8.5 19 L11.5 17.6 L8.6 10.8 L15 10.8 Z" fill={peer.color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span
              className="absolute top-4 left-3.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-sm"
              style={{ backgroundColor: peer.color }}
            >
              {peer.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
