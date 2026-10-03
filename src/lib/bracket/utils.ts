// ---------------------------------------------------------------------------
// Bracket Engine – Shared Utilities (v2)
// ---------------------------------------------------------------------------
import { Entrant, Match, MatchStatus, SlotSource, StageState } from './types';

let _counter = 0;
export function makeId(prefix = 'm'): string {
  return `${prefix}-${++_counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function resetIdCounter(): void {
  _counter = 0;
}

/** Next power of 2 >= n */
export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * Standard single-elimination bracket seeding.
 * Given a bracket of `size` slots (power of 2), returns `size/2` pairs [seedA, seedB]
 * for the first round, ordered by position (top → bottom).
 *
 * Rules:
 *   - Seed 1 vs seed `size`
 *   - Seed 2 vs seed `size-1`
 *   - etc., arranged so that 1 can only meet 2 in the final, 3 or 4 in the semis, etc.
 *
 * The recursive half-splitting method:
 *   positions array starts as [1,2,...,size], representing bracket slots.
 *   At each level, slots pair up: slot[0] vs slot[size-1], slot[1] vs slot[size-2], etc.
 *   Recurse by keeping every other slot (the "seed" for sub-bracket).
 */
export function seededPairs(size: number): Array<[number, number]> {
  // Build ordering recursively
  // `order` is an array of length `size` where order[i] = seed placed in slot i
  function buildOrder(n: number): number[] {
    if (n === 1) return [1];
    const prev = buildOrder(n / 2);
    const result: number[] = [];
    for (const seed of prev) {
      result.push(seed);
      result.push(n + 1 - seed);
    }
    return result;
  }

  const order = buildOrder(size);
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < size / 2; i++) {
    pairs.push([order[i * 2], order[i * 2 + 1]]);
  }
  return pairs;
}

export function makeMatch(
  round: number,
  position: number,
  side: Match['side'],
  groupId: string | null,
  sourceA: SlotSource,
  sourceB: SlotSource,
  entrantA: string | null = null,
  entrantB: string | null = null
): Match {
  return {
    id: makeId(),
    round,
    position,
    side,
    groupId,
    entrantA,
    entrantB,
    sourceA,
    sourceB,
    scoreA: null,
    scoreB: null,
    winnerId: null,
    loserId: null,
    status: 'pending' as MatchStatus,
  };
}

/** Iteratively resolve slots until stable. Handles transitive bye propagation. */
export function resolveSlots(matches: Match[]): Match[] {
  let current = matches.map((m) => ({ ...m }));
  let changed = true;

  while (changed) {
    changed = false;
    const byId = new Map(current.map((m) => [m.id, m]));

    current = current.map((m) => {
      if (m.status === 'completed') return m;
      const updated = resolveOne(m, byId);
      if (updated !== m) {
        changed = true;
        return updated;
      }
      return m;
    });
  }

  return current;
}

function resolveOne(m: Match, byId: Map<string, Match>): Match {
  let entrantA = m.entrantA;
  let entrantB = m.entrantB;

  if (entrantA === null && m.sourceA.kind !== 'bye') {
    const r = resolveSource(m.sourceA, byId);
    if (r !== null) entrantA = r;
  }
  if (entrantB === null && m.sourceB.kind !== 'bye') {
    const r = resolveSource(m.sourceB, byId);
    if (r !== null) entrantB = r;
  }

  const isByeA = m.sourceA.kind === 'bye';
  const isByeB = m.sourceB.kind === 'bye';

  if (isByeA || isByeB) {
    const nonByeEntrant = isByeA ? entrantB : entrantA;
    if (nonByeEntrant !== null) {
      return {
        ...m,
        entrantA,
        entrantB,
        winnerId: nonByeEntrant,
        loserId: null,
        scoreA: isByeA ? 0 : 1,
        scoreB: isByeB ? 0 : 1,
        status: 'completed',
      };
    }
  }

  if (entrantA !== null && entrantB !== null && m.status === 'pending') {
    return { ...m, entrantA, entrantB, status: 'ready' };
  }

  if (entrantA !== m.entrantA || entrantB !== m.entrantB) {
    return { ...m, entrantA, entrantB };
  }

  return m;
}

function resolveSource(source: SlotSource, byId: Map<string, Match>): string | null {
  if (source.kind === 'seed' || source.kind === 'tbd') return null;
  if (source.kind === 'bye') return null;
  const ref = byId.get((source as any).matchId);
  if (!ref || ref.status !== 'completed') return null;
  return source.kind === 'winner' ? (ref.winnerId ?? null) : (ref.loserId ?? null);
}

export function entrantBySeed(entrants: Entrant[], seed: number): string | null {
  return entrants.find((e) => e.seed === seed)?.id ?? null;
}

export function downstreamMatches(state: StageState, matchId: string): Match[] {
  return state.matches.filter((m) => {
    const depA =
      (m.sourceA.kind === 'winner' || m.sourceA.kind === 'loser') &&
      (m.sourceA as any).matchId === matchId;
    const depB =
      (m.sourceB.kind === 'winner' || m.sourceB.kind === 'loser') &&
      (m.sourceB as any).matchId === matchId;
    return depA || depB;
  });
}

export function allDownstream(state: StageState, matchId: string): Set<string> {
  const result = new Set<string>();
  const queue = [matchId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const m of downstreamMatches(state, id)) {
      if (!result.has(m.id)) {
        result.add(m.id);
        queue.push(m.id);
      }
    }
  }
  return result;
}
