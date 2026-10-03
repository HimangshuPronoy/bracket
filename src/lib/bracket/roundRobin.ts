// ---------------------------------------------------------------------------
// Bracket Engine – Round Robin Generator
//
// Supports groups (pools). Within each group, every entrant plays every other
// once using a standard circle/round-robin scheduling algorithm.
// ---------------------------------------------------------------------------
import { Entrant, Match, StageSettings, StageState } from './types';
import { makeId, makeMatch, resolveSlots } from './utils';

export function generateRoundRobin(
  entrants: Entrant[],
  opts: StageSettings = {}
): StageState {
  const groupCount = opts.groupCount ?? 1;
  const allMatches: Match[] = [];

  // Distribute entrants into groups by seed (snake draft)
  const groups: Entrant[][] = Array.from({ length: groupCount }, () => []);
  entrants.forEach((e, i) => {
    groups[i % groupCount].push(e);
  });

  // Generate round-robin schedule for each group using circle method
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    const groupId = makeId('group');
    const matches = circleRoundRobin(group, groupId);
    allMatches.push(...matches);
  }

  const resolved = resolveSlots(allMatches);

  return {
    id: makeId('stage'),
    format: 'round_robin',
    entrants,
    matches: resolved,
    settings: opts,
    status: 'in_progress',
  };
}

/** Circle method: generates ceil(n/2) * (n-1) matches for n entrants in a group.
 *  If n is odd, one entrant gets a bye each round.
 */
function circleRoundRobin(entrants: Entrant[], groupId: string): Match[] {
  const matches: Match[] = [];
  let players = [...entrants];

  // If odd number, add a dummy "bye" player
  const hasBye = players.length % 2 !== 0;
  if (hasBye) {
    players = [...players, { id: 'BYE', seed: -1 }];
  }

  const n = players.length;
  const rounds = n - 1;
  const fixed = players[0];
  const rotating = players.slice(1);

  for (let r = 0; r < rounds; r++) {
    const round = r + 1;
    const current = [fixed, ...rotating];

    for (let i = 0; i < n / 2; i++) {
      const a = current[i];
      const b = current[n - 1 - i];
      const isBye = a.id === 'BYE' || b.id === 'BYE';
      if (!isBye) {
        matches.push(
          makeMatch(
            round,
            i,
            null,
            groupId,
            { kind: 'seed', seed: a.seed },
            { kind: 'seed', seed: b.seed },
            a.id,
            b.id
          )
        );
      }
    }

    // Rotate: move last element of rotating to front
    rotating.unshift(rotating.pop()!);
  }

  return matches;
}
