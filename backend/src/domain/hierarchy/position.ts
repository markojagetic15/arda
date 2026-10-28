export const POSITION_GAP = 65536;

/**
 * Computes a position strictly between two siblings' positions. Returns null
 * when there is no integer room left - the caller must rebalance the whole
 * sibling list (see `rebalancePositions`) and retry.
 */
export function computePosition(
  prev: number | null,
  next: number | null,
): number | null {
  if (prev === null && next === null) {
    return POSITION_GAP;
  }
  if (prev === null) {
    return next! - POSITION_GAP;
  }
  if (next === null) {
    return prev + POSITION_GAP;
  }
  const mid = Math.floor((prev + next) / 2);
  if (mid <= prev || mid >= next) {
    return null;
  }
  return mid;
}

/**
 * Assigns fresh, evenly-gapped positions to an ordered list of sibling ids.
 */
export function rebalancePositions(count: number): number[] {
  return Array.from(
    { length: count },
    (_, index) => (index + 1) * POSITION_GAP,
  );
}
