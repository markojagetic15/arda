/**
 * Cursor/avatar colors. Hex only: Tiptap's caret extension treats anything
 * that isn't `#RRGGBB` as transparent (and appends an alpha suffix for the
 * selection highlight). All readable with white label text in both themes.
 */
export const CURSOR_COLORS = [
  '#E5484D', // red
  '#0090FF', // blue
  '#30A46C', // green
  '#8E4EC6', // purple
  '#F76B15', // orange
  '#0D9488', // teal
  '#D6409F', // pink
  '#3E63DD', // indigo
  '#C27C0E', // amber
  '#7C66DC', // violet
  '#5C7C2F', // olive
  '#A35829', // brown
]

function hash(value: string): number {
  let result = 0
  for (let i = 0; i < value.length; i++) result = value.charCodeAt(i) + ((result << 5) - result)
  return Math.abs(result)
}

/** The user's preferred color - stable across pages and sessions. */
export function colorForUserId(userId: string): string {
  return CURSOR_COLORS[hash(userId) % CURSOR_COLORS.length]
}

interface PresenceLike {
  id: string
  color: string
}

/**
 * The color this client should show on a page: the user's preferred color,
 * unless another person already on the page holds it. Clients with a lower
 * awareness client id keep their color and the rest move to the next free
 * palette entry, so every client resolves a clash the same way. Several
 * tabs of the same person share one color.
 */
export function pickSessionColor(
  userId: string,
  clientId: number,
  others: { clientId: number; presence: PresenceLike }[],
): string {
  const taken = new Set(
    others
      .filter((other) => other.presence.id !== userId && other.clientId < clientId)
      .map((other) => other.presence.color),
  )
  const start = CURSOR_COLORS.indexOf(colorForUserId(userId))
  for (let step = 0; step < CURSOR_COLORS.length; step++) {
    const color = CURSOR_COLORS[(start + step) % CURSOR_COLORS.length]
    if (!taken.has(color)) return color
  }
  return CURSOR_COLORS[start]
}
