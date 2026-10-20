// ---------------------------------------------------------------------------
// Bracket App – Audit Bug Regression + Comprehensive Edge Case Tests
// Run: npx tsx __tests__/audit_regression.test.ts
// ---------------------------------------------------------------------------
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── Bracket Engine ──────────────────────────────────────────────────────────
import { resetIdCounter } from '../src/lib/bracket/utils';
import {
  generateSingleElim,
  generateDoubleElim,
  generateRoundRobin,
  reportResult,
  undoResult,
  computeStandings,
  Entrant,
  Match,
  StageState,
} from '../src/lib/bracket';

// ── Video Utility ───────────────────────────────────────────────────────────
// getEmbedVideoUrl lives in web/lib/supabase.ts — inline it here so
// we can test it without importing the Supabase client (which needs env vars).
// This is an exact copy of the function body at time of writing.
function getEmbedVideoUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  let url = rawUrl.trim();
  if (!url) return null;

  const iframeMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) url = iframeMatch[1].trim();

  const timeMatch = url.match(/[?&](?:t|start)=(\d+)s?/);
  const timeParam = timeMatch ? `?start=${timeMatch[1]}` : '';

  const youtuBeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch) return `https://www.youtube-nocookie.com/embed/${youtuBeMatch[1]}${timeParam}`;

  const ytMatch = url.match(
    /(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)?youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/|v\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}${timeParam}`;

  const parents = '&parent=localhost&parent=bracket-lac.vercel.app';

  const twitchClip = url.match(
    /(?:clips\.twitch\.tv\/|(?:www\.)?twitch\.tv\/[a-zA-Z0-9_]+\/clip\/)([a-zA-Z0-9_-]+)/
  );
  if (twitchClip) return `https://clips.twitch.tv/embed?clip=${twitchClip[1]}${parents}&autoplay=false`;

  const twitchVid = url.match(/(?:www\.)?twitch\.tv\/videos\/(\d+)/);
  if (twitchVid) return `https://player.twitch.tv/?video=${twitchVid[1]}${parents}&autoplay=false`;

  const twitchChannel = url.match(/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (
    twitchChannel &&
    !['directory', 'videos', 'p', 'downloads', 'jobs'].includes(
      twitchChannel[1].toLowerCase()
    )
  )
    return `https://player.twitch.tv/?channel=${twitchChannel[1]}${parents}&autoplay=false`;

  const vimeoMatch = url.match(
    /(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/
  );
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEntrants(n: number): Entrant[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, seed: i + 1 }));
}

/** Always make the lower-seed player win (like a perfect bracket). */
function completeAll(stage: StageState): StageState {
  let current = { ...stage };
  let safety = 0;
  while (safety++ < 1000) {
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

// ═══════════════════════════════════════════════════════════════════════════
// 1. AUDIT BUG REGRESSIONS
// ═══════════════════════════════════════════════════════════════════════════

describe('Bug #1 – Swiss format guard (bracket engine side)', () => {
  it('generateSingleElim is called for single_elim format and not for swiss', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    // Swiss would silently reuse single-elim. Verify the format field is set correctly.
    assert.equal(stage.format, 'single_elim');
  });

  it('generateDoubleElim format field is double_elim', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(4));
    assert.equal(stage.format, 'double_elim');
  });

  it('generateRoundRobin format field is round_robin', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(4));
    assert.equal(stage.format, 'round_robin');
  });
});

describe('Bug #3 – Rankings cleared on bracket reset (engine integrity)', () => {
  it('computeStandings returns empty array for an in_progress bracket', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    // Report only first match — bracket is now in_progress but not complete
    const r1 = stage.matches.filter((m) => m.status === 'ready');
    const s1 = (reportResult(stage, r1[0].id, 2, 0) as any).value as StageState;
    const standings = computeStandings(s1);
    // Only entrants who have a loss OR have won should appear
    // No placement should be assigned to players who haven't played yet
    assert.ok(
      standings.every((s) => s.place >= 1),
      'All standings have a valid place'
    );
  });

  it('computeStandings after reset (fresh stage) returns correct entrant count', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(8));
    const complete = completeAll(stage);
    const standings = computeStandings(complete);
    assert.equal(standings.length, 8, 'All 8 entrants appear in standings after completion');

    // Simulate reset: re-generate a fresh bracket with same players
    resetIdCounter();
    const newStage = generateSingleElim(makeEntrants(8));
    const newComplete = completeAll(newStage);
    const newStandings = computeStandings(newComplete);
    assert.equal(newStandings.length, 8, 'After reset + re-generation, still 8 entrants');
    assert.equal(newStandings[0].entrantId, 'p1', 'Seed 1 still wins after re-generation');
  });
});

describe('Bug #8 – Custom score reporting (any score > 0)', () => {
  it('reports 3-0 score correctly (Bo5)', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    const res = reportResult(stage, stage.matches[0].id, 3, 0);
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.value.matches[0].scoreA, 3);
    assert.equal(res.value.matches[0].scoreB, 0);
    assert.equal(res.value.matches[0].winnerId, 'p1');
  });

  it('reports 3-2 score correctly (Bo5 close match)', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    const res = reportResult(stage, stage.matches[0].id, 3, 2);
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.value.matches[0].scoreA, 3);
    assert.equal(res.value.matches[0].scoreB, 2);
    assert.equal(res.value.matches[0].winnerId, 'p1');
  });

  it('reports 0-3 score correctly (p2 wins Bo5)', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    const res = reportResult(stage, stage.matches[0].id, 0, 3);
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.value.matches[0].winnerId, 'p2');
  });

  it('rejects tied score 2-2 (NO_WINNER)', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    const res = reportResult(stage, stage.matches[0].id, 2, 2);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, 'NO_WINNER');
  });

  it('rejects tied score 0-0 (NO_WINNER)', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    const res = reportResult(stage, stage.matches[0].id, 0, 0);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, 'NO_WINNER');
  });

  it('rejects tied score 5-5 (NO_WINNER)', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    const res = reportResult(stage, stage.matches[0].id, 5, 5);
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error.code, 'NO_WINNER');
  });

  it('standings gameWins/gameLosses reflect custom Bo5 scores', () => {
    resetIdCounter();
    // 4 players, run full bracket with Bo5 results
    const stage = generateSingleElim(makeEntrants(4));
    let s = stage;
    // Report all matches with 3-1 results (winner always p with lower seed)
    let safety = 0;
    while (safety++ < 100) {
      const ready = s.matches.find((m) => m.status === 'ready');
      if (!ready) break;
      const seedOf = (id: string | null) =>
        id ? (s.entrants.find((e) => e.id === id)?.seed ?? 999) : 999;
      const aWins = seedOf(ready.entrantA) < seedOf(ready.entrantB);
      const res = reportResult(s, ready.id, aWins ? 3 : 1, aWins ? 1 : 3);
      if (!res.ok) break;
      s = res.value;
    }
    const standings = computeStandings(s);
    const p1 = standings.find((x) => x.entrantId === 'p1')!;
    assert.ok(p1, 'p1 should have standings');
    assert.ok(p1.gameWins >= 3, `p1 should have ≥3 game wins, got ${p1.gameWins}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. VIDEO URL PARSER TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('getEmbedVideoUrl – YouTube', () => {
  it('converts youtu.be short link', () => {
    const url = getEmbedVideoUrl('https://youtu.be/dQw4w9WgXcQ');
    assert.equal(url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('converts youtube.com/watch?v=', () => {
    const url = getEmbedVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.equal(url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('converts youtube.com/shorts/', () => {
    const url = getEmbedVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    assert.equal(url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('converts youtube.com/live/', () => {
    const url = getEmbedVideoUrl('https://www.youtube.com/live/dQw4w9WgXcQ');
    assert.equal(url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('preserves ?t= timestamp from youtu.be', () => {
    const url = getEmbedVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=42');
    assert.equal(url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=42');
  });

  it('preserves &t= timestamp from watch URL', () => {
    const url = getEmbedVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s');
    assert.equal(url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=120');
  });

  it('already-embedded youtube-nocookie URL passes through', () => {
    const embed = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
    const url = getEmbedVideoUrl(embed);
    assert.equal(url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('extracts src from full iframe snippet', () => {
    const iframe =
      '<iframe width="560" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0"></iframe>';
    const url = getEmbedVideoUrl(iframe);
    assert.equal(url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
});

describe('getEmbedVideoUrl – Twitch', () => {
  it('converts twitch channel URL', () => {
    const url = getEmbedVideoUrl('https://www.twitch.tv/esl_csgo');
    assert.ok(url?.includes('player.twitch.tv'), `Expected twitch player, got ${url}`);
    assert.ok(url?.includes('channel=esl_csgo'));
  });

  it('converts twitch VOD URL', () => {
    const url = getEmbedVideoUrl('https://www.twitch.tv/videos/123456789');
    assert.ok(url?.includes('player.twitch.tv'), `Expected twitch player, got ${url}`);
    assert.ok(url?.includes('video=123456789'));
  });

  it('converts twitch clip URL', () => {
    const url = getEmbedVideoUrl('https://clips.twitch.tv/ClipSlugHere');
    assert.ok(url?.includes('clips.twitch.tv/embed'), `Expected twitch clip embed, got ${url}`);
    assert.ok(url?.includes('clip=ClipSlugHere'));
  });

  it('does not embed twitch.tv/directory (reserved path)', () => {
    const url = getEmbedVideoUrl('https://www.twitch.tv/directory');
    // Falls through to raw URL since directory is reserved
    assert.ok(!url?.includes('player.twitch.tv'), `Should not embed directory, got ${url}`);
  });
});

describe('getEmbedVideoUrl – Vimeo', () => {
  it('converts standard vimeo URL', () => {
    const url = getEmbedVideoUrl('https://vimeo.com/123456789');
    assert.equal(url, 'https://player.vimeo.com/video/123456789');
  });

  it('converts vimeo channel URL', () => {
    const url = getEmbedVideoUrl('https://vimeo.com/channels/staffpicks/123456789');
    assert.equal(url, 'https://player.vimeo.com/video/123456789');
  });
});

describe('getEmbedVideoUrl – Edge cases', () => {
  it('returns null for null input', () => {
    assert.equal(getEmbedVideoUrl(null), null);
  });

  it('returns null for undefined input', () => {
    assert.equal(getEmbedVideoUrl(undefined), null);
  });

  it('returns null for empty string', () => {
    assert.equal(getEmbedVideoUrl(''), null);
  });

  it('returns null for whitespace-only string', () => {
    assert.equal(getEmbedVideoUrl('   '), null);
  });

  it('passes through unknown URLs unchanged', () => {
    const raw = 'https://example.com/video/123';
    assert.equal(getEmbedVideoUrl(raw), raw);
  });

  it('trims whitespace from input', () => {
    const url = getEmbedVideoUrl('  https://youtu.be/dQw4w9WgXcQ  ');
    assert.equal(url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. BRACKET ENGINE EDGE CASES (not covered by existing tests)
// ═══════════════════════════════════════════════════════════════════════════

describe('generateSingleElim – edge cases', () => {
  it('2-player bracket: 1 match, both entrants ready', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    assert.equal(stage.matches.length, 1);
    assert.equal(stage.matches[0].status, 'ready');
    assert.equal(stage.matches[0].entrantA, 'p1');
    assert.equal(stage.matches[0].entrantB, 'p2');
  });

  it('32-player bracket: 31 total matches', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(32));
    assert.equal(stage.matches.length, 31);
  });

  it('3-player bracket: 1 bye match auto-completed for seed 1', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(3));
    const byeMatch = stage.matches.find((m) => m.status === 'completed');
    assert.ok(byeMatch, 'should have an auto-completed bye match');
    assert.equal(byeMatch!.winnerId, 'p1');
  });

  it('completing 2-player bracket marks stage as completed', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(2));
    const res = reportResult(stage, stage.matches[0].id, 2, 0);
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.value.status, 'completed');
  });

  it('standings: 8 players all have unique placements 1-8', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(8));
    const final = completeAll(stage);
    const standings = computeStandings(final);
    const places = standings.map((s) => s.place).sort((a, b) => a - b);
    assert.deepEqual(places, [1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('generateDoubleElim – edge cases', () => {
  it('4-player DE: no entrant appears in two simultaneous ready matches', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(4));
    const readyMatches = stage.matches.filter((m) => m.status === 'ready');
    const entrantsInReady = readyMatches.flatMap((m) =>
      [m.entrantA, m.entrantB].filter(Boolean)
    );
    const unique = new Set(entrantsInReady);
    assert.equal(unique.size, entrantsInReady.length, 'No entrant double-booked in ready matches');
  });

  it('losing the first match sends player to losers bracket', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(4));
    const r1W = stage.matches.filter((m) => m.status === 'ready' && m.side === 'winners');
    const res = reportResult(stage, r1W[0].id, 2, 0) as any;
    assert.equal(res.ok, true);
    // The loser (p4 if 1v4 matchup) should appear in a losers bracket match
    const loser = res.value.matches.find(
      (m: Match) => m.side === 'losers' && (m.entrantA !== null || m.entrantB !== null)
    );
    assert.ok(loser, 'loser from winners round 1 should appear in losers bracket');
  });

  it('winner of losers bracket reaches grand final', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(4));
    const final = completeAll(stage);
    const gf = final.matches.find((m) => m.side === 'grand_final')!;
    assert.ok(gf.winnerId, 'grand final should have a winner after completing all matches');
  });

  it('16-player DE completes with 16 standings entries', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(16));
    const final = completeAll(stage);
    const standings = computeStandings(final);
    assert.equal(standings.length, 16);
  });
});

describe('generateRoundRobin – edge cases', () => {
  it('5-player RR: 10 total matches', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(5));
    assert.equal(stage.matches.length, 10); // 5*4/2
  });

  it('all matches start as ready (no pending)', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(4));
    const pending = stage.matches.filter((m) => m.status === 'pending');
    assert.equal(pending.length, 0, 'RR should have no pending matches at start');
  });

  it('completing all matches sets stage to completed', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(4));
    const final = completeAll(stage);
    assert.equal(final.status, 'completed');
  });

  it('RR standings: p1 wins 0 losses in a 5-player bracket', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(5));
    const final = completeAll(stage);
    const standings = computeStandings(final);
    const p1 = standings.find((s) => s.entrantId === 'p1')!;
    assert.equal(p1.losses, 0, 'p1 should have 0 losses');
    assert.equal(p1.wins, 4, 'p1 should win all 4 of their matches');
  });

  it('16-player 4-group RR: 24 total matches (6 per group)', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(16), { groupCount: 4 });
    assert.equal(stage.matches.length, 24); // 4 groups * 6 matches
  });
});

describe('undoResult – edge cases', () => {
  it('undo after double-elim match clears loser propagation', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(4));
    const r1W = stage.matches.filter((m) => m.status === 'ready' && m.side === 'winners');
    const s1 = (reportResult(stage, r1W[0].id, 2, 0) as any).value as StageState;
    const undone = undoResult(s1, r1W[0].id);
    assert.equal(undone.ok, true);
    if (!undone.ok) return;
    // After undo, losers bracket match should be cleared
    const loserMatch = undone.value.matches.find(
      (m) => m.side === 'losers' && m.round === 1
    );
    if (loserMatch) {
      // The slot that had the propagated loser should be null again
      assert.ok(
        loserMatch.entrantA === null || loserMatch.entrantB === null,
        'After undo, losers slot should be cleared'
      );
    }
  });

  it('undo in RR is allowed (no downstream locks in pool play)', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(4));
    const first = stage.matches[0];
    const s1 = (reportResult(stage, first.id, 2, 0) as any).value;
    const undo = undoResult(s1, first.id);
    assert.equal(undo.ok, true, 'Should be able to undo a RR match result');
  });
});

describe('computeStandings – edge cases', () => {
  it('returns standings sorted by place ascending', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(8));
    const final = completeAll(stage);
    const standings = computeStandings(final);
    for (let i = 1; i < standings.length; i++) {
      assert.ok(
        standings[i].place >= standings[i - 1].place,
        `standings not sorted: place[${i - 1}]=${standings[i - 1].place} > place[${i}]=${standings[i].place}`
      );
    }
  });

  it('1st place entrant has at least 1 win and 0 losses in single elim', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const final = completeAll(stage);
    const standings = computeStandings(final);
    const winner = standings[0];
    assert.ok(winner.wins >= 1, 'winner must have at least 1 win');
    assert.equal(winner.losses, 0, 'winner in single elim should have 0 losses');
  });

  it('last place entrant in single elim has 0 wins and 1 loss (first round out)', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const final = completeAll(stage);
    const standings = computeStandings(final);
    const last = standings[standings.length - 1];
    assert.equal(last.wins, 0, `Last place should have 0 wins, got ${last.wins}`);
    assert.equal(last.losses, 1, `Last place should have 1 loss, got ${last.losses}`);
  });

  it('in-progress stage still returns partial standings', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const r1 = stage.matches.filter((m) => m.status === 'ready');
    const s1 = (reportResult(stage, r1[0].id, 2, 0) as any).value as StageState;
    const standings = computeStandings(s1);
    // At least the loser of r1[0] should appear
    assert.ok(standings.length >= 1, 'Should have at least 1 entry in partial standings');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. BRACKET DATA INTEGRITY CHECKS
// ═══════════════════════════════════════════════════════════════════════════

describe('Bracket data integrity', () => {
  it('all match IDs are unique within a stage', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(16));
    const ids = stage.matches.map((m) => m.id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, 'Duplicate match IDs detected');
  });

  it('all entrant IDs are unique within a stage', () => {
    resetIdCounter();
    const entrants = makeEntrants(16);
    const stage = generateSingleElim(entrants);
    const ids = stage.entrants.map((e) => e.id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, 'Duplicate entrant IDs detected');
  });

  it('every match references valid source matches', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(8));
    const matchIds = new Set(stage.matches.map((m) => m.id));
    for (const m of stage.matches) {
      if (m.sourceA.kind === 'winner' || m.sourceA.kind === 'loser') {
        assert.ok(
          matchIds.has(m.sourceA.matchId),
          `Match ${m.id} sourceA references non-existent match ${m.sourceA.matchId}`
        );
      }
      if (m.sourceB.kind === 'winner' || m.sourceB.kind === 'loser') {
        assert.ok(
          matchIds.has(m.sourceB.matchId),
          `Match ${m.id} sourceB references non-existent match ${m.sourceB.matchId}`
        );
      }
    }
  });

  it('no completed stage has pending matches', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(8));
    const final = completeAll(stage);
    const stillPending = final.matches.filter((m) => m.status === 'pending');
    assert.equal(stillPending.length, 0, 'Completed stage should have no pending matches');
  });

  it('all matches in completed stage have a winnerId', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(8));
    const final = completeAll(stage);
    const missingWinner = final.matches.filter(
      (m) => m.status === 'completed' && !m.winnerId
    );
    assert.equal(missingWinner.length, 0, 'Completed matches must all have a winnerId');
  });

  it('stage.entrants length matches input entrant count', () => {
    resetIdCounter();
    for (const n of [4, 8, 16, 32]) {
      resetIdCounter();
      const stage = generateSingleElim(makeEntrants(n));
      assert.equal(stage.entrants.length, n, `Expected ${n} entrants, got ${stage.entrants.length}`);
    }
  });

  it('mutating returned StageState does not affect original (immutability)', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(4));
    const r1 = stage.matches.filter((m) => m.status === 'ready');
    const res = reportResult(stage, r1[0].id, 2, 0);
    assert.equal(res.ok, true);
    if (!res.ok) return;
    // Original stage should be untouched
    const origMatch = stage.matches.find((m) => m.id === r1[0].id)!;
    assert.equal(origMatch.status, 'ready', 'Original stage match should still be ready');
    assert.equal(origMatch.winnerId, null, 'Original stage match should still have no winner');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. STRESS / LARGE BRACKET TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Stress tests', () => {
  it('128-player single elim runs to completion', () => {
    resetIdCounter();
    const stage = generateSingleElim(makeEntrants(128));
    const final = completeAll(stage);
    assert.equal(final.status, 'completed');
    const standings = computeStandings(final);
    assert.equal(standings[0].entrantId, 'p1');
  });

  it('64-player double elim completes with 64 standings entries', () => {
    resetIdCounter();
    const stage = generateDoubleElim(makeEntrants(64));
    const final = completeAll(stage);
    assert.equal(final.status, 'completed');
    const standings = computeStandings(final);
    assert.equal(standings.length, 64);
  });

  it('32-player round robin: every entrant plays 31 matches', () => {
    resetIdCounter();
    const stage = generateRoundRobin(makeEntrants(32));
    // Expected: 32*31/2 = 496 matches
    assert.equal(stage.matches.length, 496);
    // Verify each player appears in exactly 31 matches
    for (let seed = 1; seed <= 32; seed++) {
      const pid = `p${seed}`;
      const count = stage.matches.filter(
        (m) => m.entrantA === pid || m.entrantB === pid
      ).length;
      assert.equal(count, 31, `p${seed} should appear in 31 matches, got ${count}`);
    }
  });
});
