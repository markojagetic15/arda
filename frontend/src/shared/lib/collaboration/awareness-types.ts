export interface AwarenessUser {
  id: string
  name: string
  color: string
}

export interface CursorPosition {
  /** 0–100, percentage of the shared surface's width/height. */
  x: number
  y: number
}

export interface AwarenessState {
  user?: AwarenessUser
  cursor?: CursorPosition | null
}
