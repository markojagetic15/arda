import { describe, expect, it } from 'vitest';

import {
  computePosition,
  POSITION_GAP,
  rebalancePositions,
} from './position.js';

describe('computePosition', () => {
  it('returns the gap when there are no siblings at all', () => {
    expect(computePosition(null, null)).toBe(POSITION_GAP);
  });

  it('appends after the last sibling', () => {
    expect(computePosition(1000, null)).toBe(1000 + POSITION_GAP);
  });

  it('prepends before the first sibling', () => {
    expect(computePosition(null, 1000)).toBe(1000 - POSITION_GAP);
  });

  it('picks the midpoint between two siblings', () => {
    expect(computePosition(1000, 2000)).toBe(1500);
  });

  it('returns null once the gap between adjacent siblings is exhausted', () => {
    expect(computePosition(1000, 1001)).toBeNull();
    expect(computePosition(1000, 1000)).toBeNull();
  });
});

describe('rebalancePositions', () => {
  it('assigns evenly gapped, strictly increasing positions', () => {
    const positions = rebalancePositions(4);
    expect(positions).toEqual([
      POSITION_GAP,
      2 * POSITION_GAP,
      3 * POSITION_GAP,
      4 * POSITION_GAP,
    ]);
  });

  it('returns an empty array for zero items', () => {
    expect(rebalancePositions(0)).toEqual([]);
  });
});
