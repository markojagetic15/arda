const GAP = 1000

/** A position placed after every item in the given (already-ordered) list. */
export function positionForNewItem(items: readonly { position: number }[]): number {
  if (items.length === 0) return GAP
  return Math.max(...items.map((item) => item.position)) + GAP
}

/** A position strictly between two neighbors - either bound may be absent (start/end of list). */
export function positionBetween(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return GAP
  if (before === undefined) return after! / 2
  if (after === undefined) return before + GAP
  return (before + after) / 2
}
