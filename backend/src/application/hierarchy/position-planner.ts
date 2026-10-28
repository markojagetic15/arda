import {
  computePosition,
  rebalancePositions,
} from '../../domain/hierarchy/position.js';

export interface PositionPlan {
  /** The position to assign to the item being inserted/moved. */
  position: number;
  /**
   * Non-null when the existing siblings needed fresh positions to make room —
   * callers must persist `siblings[i].reorder(rebalanced[i])` for each index
   * before saving the moved/created item at `position`.
   */
  rebalanced: number[] | null;
}

/**
 * Plans where to place an item among `siblings` (which must NOT include the
 * item itself) at the given 0-based `index` — i.e. "insert before the
 * sibling currently at this index".
 */
export function planPosition(
  siblings: { position: number }[],
  index: number,
): PositionPlan {
  const prev = index > 0 ? siblings[index - 1].position : null;
  const next = index < siblings.length ? siblings[index].position : null;

  const position = computePosition(prev, next);
  if (position !== null) {
    return { position, rebalanced: null };
  }

  const rebalanced = rebalancePositions(siblings.length);
  const rebalancedPrev = index > 0 ? rebalanced[index - 1] : null;
  const rebalancedNext = index < siblings.length ? rebalanced[index] : null;
  // Always succeeds: a freshly rebalanced list has a full POSITION_GAP between every pair.
  const retried = computePosition(rebalancedPrev, rebalancedNext)!;
  return { position: retried, rebalanced };
}
