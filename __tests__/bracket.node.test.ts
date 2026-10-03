// ---------------------------------------------------------------------------
// Bracket Engine – Test Suite (Node built-in test runner)
// Run: npx tsx __tests__/bracket.node.test.ts  OR  tsc + node
// ---------------------------------------------------------------------------
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// Reset ID counter before each suite - we simulate this by using a fresh module
// We'll import everything and just let IDs be unique per run
import { resetIdCounter, nextPow2 } from '../src/lib/bracket/utils';
import {
  generateSingleElim,
  generateDoubleElim,
  generateRoundRobin,
  reportResult,
  undoResult,
  computeStandings,
  advanceToNextStage,
  Entrant,
  Match,
  StageState,
} from '../src/lib/bracket';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntrants(n: number): Entrant[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, seed: i + 1 }));
}

function completeAll(stage: StageState): StageState {
  let current = { ...stage };
  let safety = 0;
  while (safety++ < 500) {
    const ready = current.matches.find((m) => m.status === 'ready');
    if (!ready) break;
    const seedOf = (id: string | null) =>
      id ? (current.entrants.find((e) => e.id === id)?.seed ?? 999) : 999;
    const scoreA = seedOf(ready.entrantA) < seedOf(ready.entrantB) ? 2 : 0;
    const scoreB = scoreA === 2 ? 0 : 2;
    const res = reportResult(current, ready.id, scoreA, scoreB);
    if (!res.ok) throw new Error(`reportResult failed: ${JSON.stringify((res as any).error)}`);
    current = res.value;
  }
  return current;
}

// ══════════════════════════════════════════════════════════════════════════════
// SINGLE ELIMINATION
// ══════════════════════════════════════════════════════════════════════════════

describe('generateSingleElim', () => {
  it('generates correct match count for various sizes', () => {
    for (const n of [2, 4, 5, 6, 7, 8, 16, 32]) {
      resetIdCounter();
      const stage = generateSingleElim(makeEntrants(n));
      const expectedMatches = nextPow2(n) - 1;
      assert.equal(stage.matches.length, expectedMatches, `n=${n}: expected ${expectedMatches} matches, got ${stage.matches.length}`);
    }
  });

  it('correct seed 1 vs seed 8 in first round for 8-player bracket', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(8));
    const r1 = stage.matches.filter((m) => m.round === 1);
    const m = r1.find(
      (m) =>
        (m.sourceA.kind === 'seed' && m.sourceA.seed === 1) ||
        (m.sourceB.kind === 'seed' && m.sourceB.seed === 1)
    )!;
    assert.ok(m, 'no match with seed 1 in round 1');
    const otherSource = m.sourceA.kind === 'seed' && m.sourceA.seed === 1 ? m.sourceB : m.sourceA;
    assert.equal(otherSource.kind, 'seed');
    assert.equal((otherSource as any).seed, 8);
  });

  it('1v4 and 2v3 pairings in 4-player bracket', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const r1 = stage.matches.filter((m) => m.round === 1);
    const seeds = r1.map((m) => {
      const sA = m.sourceA.kind === 'seed' ? m.sourceA.seed : null;
      const sB = m.sourceB.kind === 'seed' ? m.sourceB.seed : null;
      return [sA, sB].sort((a, b) => (a ?? 0) - (b ?? 0));
    });
    assert.ok(seeds.some((p) => p[0] === 1 && p[1] === 4), `expected [1,4], got ${JSON.stringify(seeds)}`);
    assert.ok(seeds.some((p) => p[0] === 2 && p[1] === 3), `expected [2,3], got ${JSON.stringify(seeds)}`);
  });

  it('byes go to top seeds (5-player: seed 1 gets bye)', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(5));
    const seed1Match = stage.matches.find(
      (m) =>
        (m.entrantA === 'p1' || m.entrantB === 'p1') &&
        (m.sourceA.kind === 'bye' || m.sourceB.kind === 'bye')
    );
    assert.ok(seed1Match, 'seed 1 should have a bye match');
    assert.equal(seed1Match!.status, 'completed');
    assert.equal(seed1Match!.winnerId, 'p1');
  });

  it('6-player: 2 auto-completed bye matches for seeds 1 and 2', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(6));
    const r1 = stage.matches.filter((m) => m.round === 1);
    const completed = r1.filter((m) => m.status === 'completed');
    assert.equal(completed.length, 2);
    const byeWinners = new Set(completed.map((m) => m.winnerId));
    assert.ok(byeWinners.has('p1'), 'p1 should be a bye winner');
    assert.ok(byeWinners.has('p2'), 'p2 should be a bye winner');
  });

  it('13-player: seeds 1-3 receive byes', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(13));
    const completedR1 = stage.matches.filter((m) => m.round === 1 && m.status === 'completed');
    assert.equal(completedR1.length, 3);
    const winners = completedR1.map((m) => m.winnerId);
    assert.ok(winners.includes('p1'), 'p1 should be a bye winner');
    assert.ok(winners.includes('p2'), 'p2 should be a bye winner');
    assert.ok(winners.includes('p3'), 'p3 should be a bye winner');
  });

  it('optional third-place match adds 1 extra match', () => {
    resetIdCounter();
    const without = generateSingleElim(makeEntrants(4));
    resetIdCounter();
    const with3p = generateSingleElim(makeEntrants(4), { thirdPlaceMatch: true });
    assert.equal(with3p.matches.length, without.matches.length + 1);
  });

  it('full 16-player tournament resolves; seed 1 wins', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(16));
    const final = completeAll(stage);
    assert.equal(final.status, 'completed');
    const standings = computeStandings(final);
    assert.equal(standings[0].entrantId, 'p1');
    assert.equal(standings[0].place, 1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DOUBLE ELIMINATION
// ══════════════════════════════════════════════════════════════════════════════

describe('generateDoubleElim', () => {
  it('4-player DE has winners, losers, and grand_final sides', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(4));
    const sides = new Set(stage.matches.map((m) => m.side));
    assert.ok(sides.has('winners'));
    assert.ok(sides.has('losers'));
    assert.ok(sides.has('grand_final'));
  });

  it('8-player: winners bracket has 7 matches (4+2+1)', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(8));
    const wMatches = stage.matches.filter((m) => m.side === 'winners');
    assert.equal(wMatches.length, 7);
  });

  it('grand final reset match starts as pending', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(4), { grandFinalReset: true });
    const gfMatches = stage.matches.filter((m) => m.side === 'grand_final');
    assert.equal(gfMatches.length, 2);
    const reset = gfMatches.find((m) => m.position === 1);
    assert.equal(reset?.status, 'pending');
  });

  it('full 8-player double-elim runs to completion; p1 wins', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(8));
    const final = completeAll(stage);
    const standings = computeStandings(final);
    assert.equal(standings[0].entrantId, 'p1');
    // All 8 entrants should have a standing
    assert.equal(standings.length, 8);
    const places = standings.map((s) => s.place).sort((a, b) => a - b);
    assert.deepEqual(places, [1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ROUND ROBIN
// ══════════════════════════════════════════════════════════════════════════════

describe('generateRoundRobin', () => {
  it('4-player RR has 6 matches (n*(n-1)/2)', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(4));
    assert.equal(stage.matches.length, 6);
  });

  it('each pair plays exactly once', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(4));
    const pairs = stage.matches.map((m) => [m.entrantA, m.entrantB].sort().join(','));
    const unique = new Set(pairs);
    assert.equal(unique.size, pairs.length);
  });

  it('3-player RR has 3 matches and no bye slots', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(3));
    assert.equal(stage.matches.length, 3);
    const hasBye = stage.matches.some((m) => m.entrantA === null || m.entrantB === null);
    assert.equal(hasBye, false);
  });

  it('8-player in 2 groups: 12 total matches (6 per group)', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(8), { groupCount: 2 });
    assert.equal(stage.matches.length, 12);
  });

  it('RR standings: p1 wins all 3 matches and ranks 1st', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(4));
    const final = completeAll(stage);
    const standings = computeStandings(final);
    assert.equal(standings[0].entrantId, 'p1');
    assert.equal(standings[0].wins, 3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// REPORT RESULT
// ══════════════════════════════════════════════════════════════════════════════

describe('reportResult', () => {
  it('propagates winner to downstream match', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const r1 = stage.matches.filter((m) => m.status === 'ready');
    const res = reportResult(stage, r1[0].id, 2, 1);
    assert.equal(res.ok, true);
    if (!res.ok) return;
    const next = res.value.matches.find(
      (m: Match) => m.round === 2 && (m.entrantA !== null || m.entrantB !== null)
    );
    assert.ok(next, 'winner should propagate to round 2 match');
  });

  it('returns NO_WINNER on draw', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    const m = stage.matches[0];
    const res = reportResult(stage, m.id, 1, 1);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, 'NO_WINNER');
  });

  it('returns MATCH_NOT_FOUND for unknown id', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const res = reportResult(stage, 'non-existent', 2, 0);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, 'MATCH_NOT_FOUND');
  });

  it('returns MATCH_NOT_READY for pending match', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(8));
    const pending = stage.matches.find((m: Match) => m.status === 'pending')!;
    const res = reportResult(stage, pending.id, 2, 0);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, 'MATCH_NOT_READY');
  });

  it('stage becomes completed after final match', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    const res = reportResult(stage, stage.matches[0].id, 2, 0);
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.value.status, 'completed');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// UNDO RESULT
// ══════════════════════════════════════════════════════════════════════════════

describe('undoResult', () => {
  it('undo resets match to ready', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const r1 = stage.matches.filter((m: Match) => m.status === 'ready');
    const reported = reportResult(stage, r1[0].id, 2, 0);
    assert.equal(reported.ok, true);
    if (!reported.ok) return;
    const undone = undoResult(reported.value, r1[0].id);
    assert.equal(undone.ok, true);
    if (!undone.ok) return;
    const m = undone.value.matches.find((m: Match) => m.id === r1[0].id)!;
    assert.equal(m.status, 'ready');
    assert.equal(m.winnerId, null);
    assert.equal(m.scoreA, null);
  });

  it('undo clears propagated winner from downstream match', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const r1 = stage.matches.filter((m: Match) => m.status === 'ready');
    const s1 = (reportResult(stage, r1[0].id, 2, 0) as any).value;
    const undo = undoResult(s1, r1[0].id);
    assert.equal(undo.ok, true);
    if (!undo.ok) return;
    const final = undo.value.matches.find((m: Match) => m.round === 2)!;
    assert.equal(final.entrantA, null);
    assert.equal(final.entrantB, null);
  });

  it('undo refuses if downstream match already completed', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const r1 = stage.matches.filter((m: Match) => m.status === 'ready');
    let s = (reportResult(stage, r1[0].id, 2, 0) as any).value;
    s = (reportResult(s, r1[1].id, 2, 0) as any).value;
    const fin = s.matches.find((m: Match) => m.round === 2)!;
    s = (reportResult(s, fin.id, 2, 0) as any).value;
    const undo = undoResult(s, r1[0].id);
    assert.equal(undo.ok, false);
    if (!undo.ok) assert.equal(undo.error.code, 'DOWNSTREAM_COMPLETED');
  });

  it('undo returns MATCH_NOT_FOUND for bad id', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const undo = undoResult(stage, 'bad-id');
    assert.equal(undo.ok, false);
    if (!undo.ok) assert.equal(undo.error.code, 'MATCH_NOT_FOUND');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STAGE ADVANCEMENT PIPELINE
// ══════════════════════════════════════════════════════════════════════════════

describe('advanceToNextStage', () => {
  it('Pools (8 groups) → Top 16: 64 entrants → 16', () => {
    resetIdCounter();
    const pools = generateRoundRobin(makeEntrants(64), { groupCount: 8 });
    const done = completeAll(pools);
    const top16 = advanceToNextStage(done, { id: 'top16', format: 'single_elim', advancingCount: 16 });
    assert.equal(top16.entrants.length, 16);
    assert.equal(top16.id, 'top16');
  });

  it('Full pipeline: 64 Pools → Top 16 → Top 8', () => {
    resetIdCounter();
    const pools = generateRoundRobin(makeEntrants(64), { groupCount: 8 });
    const poolsDone = completeAll(pools);
    const top16 = advanceToNextStage(poolsDone, { id: 'top16', format: 'single_elim', advancingCount: 16 });
    const top16Done = completeAll(top16);
    const top8 = advanceToNextStage(top16Done, { id: 'top8', format: 'single_elim', advancingCount: 8 });
    const top8Done = completeAll(top8);
    assert.equal(top8Done.status, 'completed');
    const standings = computeStandings(top8Done);
    assert.equal(standings[0].place, 1);
    assert.equal(standings.length, 8);
  });

  it('same-pool entrants separated in first round after RR advancement', () => {
    resetIdCounter();
    const pools = generateRoundRobin(makeEntrants(8), { groupCount: 2 });
    const done = completeAll(pools);
    const top4 = advanceToNextStage(done, { id: 'top4', format: 'single_elim', advancingCount: 4 });

    const groups = new Map<string, Set<string>>();
    for (const m of pools.matches) {
      if (!m.groupId) continue;
      if (!groups.has(m.groupId)) groups.set(m.groupId, new Set());
      if (m.entrantA) groups.get(m.groupId)!.add(m.entrantA);
      if (m.entrantB) groups.get(m.groupId)!.add(m.entrantB);
    }

    const r1Matches = top4.matches.filter((m: Match) => m.round === 1);
    let samePoolMatchups = 0;
    for (const m of r1Matches) {
      const gA = [...groups.entries()].find(([, v]) => v.has(m.entrantA!))?.[0];
      const gB = [...groups.entries()].find(([, v]) => v.has(m.entrantB!))?.[0];
      if (gA && gB && gA === gB) samePoolMatchups++;
    }
    assert.equal(samePoolMatchups, 0);
  });
});
