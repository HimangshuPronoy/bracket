// ---------------------------------------------------------------------------
// Bracket Engine – Single Elimination Generator
// ---------------------------------------------------------------------------
import { Entrant, Match, StageSettings, StageState } from './types';
import { entrantBySeed, makeId, makeMatch, nextPow2, resolveSlots, seededPairs } from './utils';

export function generateSingleElim(
  entrants: Entrant[],
  opts: StageSettings = {}
): StageState {
  if (entrants.length < 2) {
    return {
      id: makeId('stage'),
      format: 'single_elim',
      entrants,
      matches: [],
      settings: opts,
      status: 'pending',
    };
  }

  const n = entrants.length;
  const size = nextPow2(n);
  const rounds = Math.log2(size);

  const matches: Match[] = [];

  // --- Round 1: seeded pairs, seeds > n are byes ---
  const pairs = seededPairs(size);
  for (let pos = 0; pos < size / 2; pos++) {
    const [seedA, seedB] = pairs[pos];
    const isByeA = seedA > n;
    const isByeB = seedB > n;

    matches.push(
      makeMatch(
        1,
        pos,
        'winners',
        null,
        isByeA ? { kind: 'bye' as const } : { kind: 'seed' as const, seed: seedA },
        isByeB ? { kind: 'bye' as const } : { kind: 'seed' as const, seed: seedB },
        isByeA ? null : entrantBySeed(entrants, seedA),
        isByeB ? null : entrantBySeed(entrants, seedB)
      )
    );
  }

  // --- Subsequent rounds ---
  for (let r = 2; r <= rounds; r++) {
    const prevMatches = matches.filter((m) => m.round === r - 1);
    const matchCount = prevMatches.length / 2;
    for (let pos = 0; pos < matchCount; pos++) {
      const mA = prevMatches[pos * 2];
      const mB = prevMatches[pos * 2 + 1];
      matches.push(
        makeMatch(r, pos, 'winners', null,
          { kind: 'winner', matchId: mA.id },
          { kind: 'winner', matchId: mB.id })
      );
    }
  }

  // Optional third-place match (losers of the two semis)
  if (opts.thirdPlaceMatch && rounds >= 2) {
    const semifinalRound = rounds - 1;
    const semis = matches.filter((m) => m.round === semifinalRound);
    if (semis.length >= 2) {
      matches.push(
        makeMatch(rounds, 1, null, null,
          { kind: 'loser', matchId: semis[0].id },
          { kind: 'loser', matchId: semis[1].id })
      );
    }
  }

  const resolved = resolveSlots(matches);

  return {
    id: makeId('stage'),
    format: 'single_elim',
    entrants,
    matches: resolved,
    settings: opts,
    status: 'in_progress',
  };
}
