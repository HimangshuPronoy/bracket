// ---------------------------------------------------------------------------
// Bracket Engine – Double Elimination Generator
//
// Winners bracket:  rounds 1..wRounds   (positive)
// Losers bracket:   rounds -1..-N       (negative)
// Grand final:      round 0
//
// LB structure (for size=8, wRounds=3):
//   LB Round 1 (-1): 4 matches — pair WB R1 losers against each other (top vs bottom)
//   LB Round 2 (-2): 2 matches — LB R1 survivors vs WB R2 losers
//   LB Round 3 (-3): 2 matches — elim: LB R2 survivors play each other
//   LB Round 4 (-4): 1 match  — LB R3 survivor vs WB R3 (WF) loser
//   Grand Final (0): 1 match  — WB Final winner vs LB Final winner
// ---------------------------------------------------------------------------
import { Entrant, Match, StageSettings, StageState } from './types';
import { entrantBySeed, makeId, makeMatch, nextPow2, resolveSlots, seededPairs } from './utils';

export function generateDoubleElim(
  entrants: Entrant[],
  opts: StageSettings = {}
): StageState {
  if (entrants.length < 2) {
    return {
      id: makeId('stage'),
      format: 'double_elim',
      entrants,
      matches: [],
      settings: opts,
      status: 'pending',
    };
  }

  const n = entrants.length;
  const size = nextPow2(n);
  const wRounds = Math.log2(size); // e.g. 8 → 3, 4 → 2, 16 → 4

  // ── Winners Bracket ───────────────────────────────────────────────────────
  const allMatches: Match[] = [];

  const pairs = seededPairs(size);
  for (let pos = 0; pos < size / 2; pos++) {
    const [seedA, seedB] = pairs[pos];
    const isByeA = seedA > n;
    const isByeB = seedB > n;
    allMatches.push(
      makeMatch(1, pos, 'winners', null,
        isByeA ? { kind: 'bye' } : { kind: 'seed', seed: seedA },
        isByeB ? { kind: 'bye' } : { kind: 'seed', seed: seedB },
        isByeA ? null : entrantBySeed(entrants, seedA),
        isByeB ? null : entrantBySeed(entrants, seedB))
    );
  }

  for (let r = 2; r <= wRounds; r++) {
    const prev = allMatches.filter((m) => m.round === r - 1 && m.side === 'winners');
    for (let pos = 0; pos < prev.length / 2; pos++) {
      const mA = prev[pos * 2];
      const mB = prev[pos * 2 + 1];
      allMatches.push(
        makeMatch(r, pos, 'winners', null,
          { kind: 'winner', matchId: mA.id },
          { kind: 'winner', matchId: mB.id })
      );
    }
  }

  // ── Losers Bracket ────────────────────────────────────────────────────────
  // LB round count = 2*(wRounds-1)
  // Pattern:
  //   LB round 1 (lbR=1): pair WB-round-1 losers against each other → size/4 matches
  //   LB round 2 (lbR=2): pair WB-round-2 losers vs LB-round-1 winners → size/4 matches
  //   LB round 3 (lbR=3): elim within LB → size/8 matches
  //   ...continuing halving until 1 survivor

  // We track `lbSurvivors` = matches from last LB round (their winners advance)
  let lbSurvivors: Match[] = [];

  const totalLbRounds = 2 * (wRounds - 1);

  for (let lbR = 1; lbR <= totalLbRounds; lbR++) {
    const roundNum = -lbR;
    const newLbMatches: Match[] = [];

    if (lbR === 1) {
      // Pair WB round-1 losers: top half vs reversed bottom half
      const w1Losers = allMatches.filter((m) => m.round === 1 && m.side === 'winners');
      const half = Math.floor(w1Losers.length / 2);
      for (let pos = 0; pos < half; pos++) {
        const mTop = w1Losers[pos];
        const mBot = w1Losers[w1Losers.length - 1 - pos];
        newLbMatches.push(
          makeMatch(roundNum, pos, 'losers', null,
            { kind: 'loser', matchId: mTop.id },
            { kind: 'loser', matchId: mBot.id })
        );
      }
    } else if (lbR % 2 === 0) {
      // Even LB round: drop WB losers from WB round (lbR/2 + 1) into LB
      const wbRound = lbR / 2 + 1;
      const wbLosers = allMatches.filter((m) => m.round === wbRound && m.side === 'winners');
      // Pair each LB survivor with a WB loser
      const count = Math.min(lbSurvivors.length, wbLosers.length);
      for (let pos = 0; pos < count; pos++) {
        const survivor = lbSurvivors[pos];
        const wbLoser = wbLosers[pos];
        newLbMatches.push(
          makeMatch(roundNum, pos, 'losers', null,
            { kind: 'winner', matchId: survivor.id },
            { kind: 'loser', matchId: wbLoser.id })
        );
      }
    } else {
      // Odd LB round (≥3): elim — pair LB survivors against each other
      for (let pos = 0; pos < Math.floor(lbSurvivors.length / 2); pos++) {
        const mA = lbSurvivors[pos * 2];
        const mB = lbSurvivors[pos * 2 + 1];
        if (!mA || !mB) continue;
        newLbMatches.push(
          makeMatch(roundNum, pos, 'losers', null,
            { kind: 'winner', matchId: mA.id },
            { kind: 'winner', matchId: mB.id })
        );
      }
    }

    allMatches.push(...newLbMatches);
    lbSurvivors = newLbMatches;
  }

  // ── Grand Final ───────────────────────────────────────────────────────────
  const wFinal = allMatches.filter((m) => m.round === wRounds && m.side === 'winners').slice(-1)[0];
  const lbFinal = lbSurvivors[0];

  const gf = makeMatch(0, 0, 'grand_final', null,
    { kind: 'winner', matchId: wFinal.id },
    { kind: 'winner', matchId: lbFinal.id });
  allMatches.push(gf);

  // Optional reset
  if (opts.grandFinalReset) {
    const reset = makeMatch(0, 1, 'grand_final', null,
      { kind: 'winner', matchId: gf.id },
      { kind: 'loser', matchId: gf.id });
    allMatches.push(reset);
  }

  const resolved = resolveSlots(allMatches);

  return {
    id: makeId('stage'),
    format: 'double_elim',
    entrants,
    matches: resolved,
    settings: opts,
    status: 'in_progress',
  };
}
