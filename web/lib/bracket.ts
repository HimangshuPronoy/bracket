// =============================================================================
// Bracket Engine – Web Bundle
// All bracket logic in one file for the Next.js web app.
// Types + utils + generators + results + standings
// =============================================================================

// ── Types ─────────────────────────────────────────────────────────────────────

export type BracketFormat = 'single_elim' | 'double_elim' | 'round_robin' | 'swiss';
export type BracketSide = 'winners' | 'losers' | 'grand_final' | null;
export type MatchStatus = 'pending' | 'ready' | 'in_progress' | 'completed';
export type StageStatus = 'pending' | 'in_progress' | 'completed';

export interface Entrant {
  id: string;
  seed: number;
}

export type SlotSource =
  | { kind: 'seed'; seed: number }
  | { kind: 'winner'; matchId: string }
  | { kind: 'loser'; matchId: string }
  | { kind: 'bye' }
  | { kind: 'tbd' };

export interface Match {
  id: string;
  round: number;
  position: number;
  side: BracketSide;
  groupId: string | null;
  entrantA: string | null;
  entrantB: string | null;
  sourceA: SlotSource;
  sourceB: SlotSource;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  loserId: string | null;
  status: MatchStatus;
}

export interface StageState {
  id: string;
  format: BracketFormat;
  entrants: Entrant[];
  matches: Match[];
  settings: StageSettings;
  status: StageStatus;
}

export interface StageSettings {
  thirdPlaceMatch?: boolean;
  grandFinalReset?: boolean;
  groupCount?: number;
  rounds?: number;
}

export interface Standing {
  entrantId: string;
  place: number;
  wins: number;
  losses: number;
  gameWins: number;
  gameLosses: number;
  headToHead: Record<string, 'win' | 'loss' | 'draw'>;
}

export type BracketEngineError =
  | { code: 'MATCH_NOT_FOUND' }
  | { code: 'MATCH_NOT_READY'; matchId: string }
  | { code: 'DOWNSTREAM_COMPLETED'; matchId: string }
  | { code: 'INVALID_ENTRANT_COUNT' }
  | { code: 'NO_WINNER' };

export type Result<T> = { ok: true; value: T } | { ok: false; error: BracketEngineError };
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = (error: BracketEngineError): Result<never> => ({ ok: false, error });

// ── Utils ─────────────────────────────────────────────────────────────────────

let _counter = 0;
export function makeId(prefix = 'm'): string {
  return `${prefix}-${++_counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

export function seededPairs(size: number): Array<[number, number]> {
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

export function entrantBySeed(entrants: Entrant[], seed: number): string | null {
  return entrants.find((e) => e.seed === seed)?.id ?? null;
}

function resolveSource(source: SlotSource, byId: Map<string, Match>): string | null {
  if (source.kind === 'seed' || source.kind === 'tbd' || source.kind === 'bye') return null;
  const ref = byId.get((source as any).matchId);
  if (!ref || ref.status !== 'completed') return null;
  return source.kind === 'winner' ? (ref.winnerId ?? null) : (ref.loserId ?? null);
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

export function resolveSlots(matches: Match[]): Match[] {
  let current = matches.map((m) => ({ ...m }));
  let changed = true;
  while (changed) {
    changed = false;
    const byId = new Map(current.map((m) => [m.id, m]));
    current = current.map((m) => {
      if (m.status === 'completed') return m;
      const updated = resolveOne(m, byId);
      if (updated !== m) { changed = true; return updated; }
      return m;
    });
  }
  return current;
}

function downstreamMatchesFor(state: StageState, matchId: string): Match[] {
  return state.matches.filter((m) => {
    const depA = (m.sourceA.kind === 'winner' || m.sourceA.kind === 'loser') && (m.sourceA as any).matchId === matchId;
    const depB = (m.sourceB.kind === 'winner' || m.sourceB.kind === 'loser') && (m.sourceB as any).matchId === matchId;
    return depA || depB;
  });
}

export function allDownstream(state: StageState, matchId: string): Set<string> {
  const result = new Set<string>();
  const queue = [matchId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const m of downstreamMatchesFor(state, id)) {
      if (!result.has(m.id)) {
        result.add(m.id);
        queue.push(m.id);
      }
    }
  }
  return result;
}

// ── Single Elimination ────────────────────────────────────────────────────────

export function generateSingleElim(entrants: Entrant[], opts: StageSettings = {}): StageState {
  if (entrants.length < 2) {
    return { id: makeId('stage'), format: 'single_elim', entrants, matches: [], settings: opts, status: 'pending' };
  }
  const n = entrants.length;
  const size = nextPow2(n);
  const rounds = Math.log2(size);
  const matches: Match[] = [];
  const pairs = seededPairs(size);

  for (let pos = 0; pos < size / 2; pos++) {
    const [seedA, seedB] = pairs[pos];
    const isByeA = seedA > n;
    const isByeB = seedB > n;
    matches.push(makeMatch(1, pos, 'winners', null,
      isByeA ? { kind: 'bye' } : { kind: 'seed', seed: seedA },
      isByeB ? { kind: 'bye' } : { kind: 'seed', seed: seedB },
      isByeA ? null : entrantBySeed(entrants, seedA),
      isByeB ? null : entrantBySeed(entrants, seedB)));
  }

  for (let r = 2; r <= rounds; r++) {
    const prevMatches = matches.filter((m) => m.round === r - 1);
    for (let pos = 0; pos < prevMatches.length / 2; pos++) {
      const mA = prevMatches[pos * 2];
      const mB = prevMatches[pos * 2 + 1];
      matches.push(makeMatch(r, pos, 'winners', null, { kind: 'winner', matchId: mA.id }, { kind: 'winner', matchId: mB.id }));
    }
  }

  return { id: makeId('stage'), format: 'single_elim', entrants, matches: resolveSlots(matches), settings: opts, status: 'in_progress' };
}

// ── Double Elimination ────────────────────────────────────────────────────────

export function generateDoubleElim(entrants: Entrant[], opts: StageSettings = {}): StageState {
  if (entrants.length < 2) {
    return { id: makeId('stage'), format: 'double_elim', entrants, matches: [], settings: opts, status: 'pending' };
  }

  const n = entrants.length;
  const size = nextPow2(n);
  const wRounds = Math.log2(size);
  const allMatches: Match[] = [];
  const pairs = seededPairs(size);

  for (let pos = 0; pos < size / 2; pos++) {
    const [seedA, seedB] = pairs[pos];
    const isByeA = seedA > n;
    const isByeB = seedB > n;
    allMatches.push(makeMatch(1, pos, 'winners', null,
      isByeA ? { kind: 'bye' } : { kind: 'seed', seed: seedA },
      isByeB ? { kind: 'bye' } : { kind: 'seed', seed: seedB },
      isByeA ? null : entrantBySeed(entrants, seedA),
      isByeB ? null : entrantBySeed(entrants, seedB)));
  }

  for (let r = 2; r <= wRounds; r++) {
    const prev = allMatches.filter((m) => m.round === r - 1 && m.side === 'winners');
    for (let pos = 0; pos < prev.length / 2; pos++) {
      const mA = prev[pos * 2];
      const mB = prev[pos * 2 + 1];
      allMatches.push(makeMatch(r, pos, 'winners', null, { kind: 'winner', matchId: mA.id }, { kind: 'winner', matchId: mB.id }));
    }
  }

  let lbSurvivors: Match[] = [];
  const totalLbRounds = 2 * (wRounds - 1);

  for (let lbR = 1; lbR <= totalLbRounds; lbR++) {
    const roundNum = -lbR;
    const newLbMatches: Match[] = [];

    if (lbR === 1) {
      const w1Losers = allMatches.filter((m) => m.round === 1 && m.side === 'winners');
      const half = Math.floor(w1Losers.length / 2);
      for (let pos = 0; pos < half; pos++) {
        const mTop = w1Losers[pos];
        const mBot = w1Losers[w1Losers.length - 1 - pos];
        newLbMatches.push(makeMatch(roundNum, pos, 'losers', null, { kind: 'loser', matchId: mTop.id }, { kind: 'loser', matchId: mBot.id }));
      }
    } else if (lbR % 2 === 0) {
      const wbRound = lbR / 2 + 1;
      const wbLosers = allMatches.filter((m) => m.round === wbRound && m.side === 'winners');
      const count = Math.min(lbSurvivors.length, wbLosers.length);
      for (let pos = 0; pos < count; pos++) {
        newLbMatches.push(makeMatch(roundNum, pos, 'losers', null, { kind: 'winner', matchId: lbSurvivors[pos].id }, { kind: 'loser', matchId: wbLosers[pos].id }));
      }
    } else {
      for (let pos = 0; pos < Math.floor(lbSurvivors.length / 2); pos++) {
        const mA = lbSurvivors[pos * 2];
        const mB = lbSurvivors[pos * 2 + 1];
        if (!mA || !mB) continue;
        newLbMatches.push(makeMatch(roundNum, pos, 'losers', null, { kind: 'winner', matchId: mA.id }, { kind: 'winner', matchId: mB.id }));
      }
    }

    allMatches.push(...newLbMatches);
    lbSurvivors = newLbMatches;
  }

  const wFinal = allMatches.filter((m) => m.round === wRounds && m.side === 'winners').slice(-1)[0];
  const lbFinal = lbSurvivors[0];
  const gf = makeMatch(0, 0, 'grand_final', null, { kind: 'winner', matchId: wFinal.id }, { kind: 'winner', matchId: lbFinal.id });
  allMatches.push(gf);

  if (opts.grandFinalReset) {
    allMatches.push(makeMatch(0, 1, 'grand_final', null, { kind: 'winner', matchId: gf.id }, { kind: 'loser', matchId: gf.id }));
  }

  return { id: makeId('stage'), format: 'double_elim', entrants, matches: resolveSlots(allMatches), settings: opts, status: 'in_progress' };
}

// ── Round Robin ───────────────────────────────────────────────────────────────

export function generateRoundRobin(entrants: Entrant[], opts: StageSettings = {}): StageState {
  const groupCount = opts.groupCount ?? 1;
  const allMatches: Match[] = [];
  const groups: Entrant[][] = Array.from({ length: groupCount }, () => []);
  entrants.forEach((e, i) => { groups[i % groupCount].push(e); });

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    const groupId = makeId('group');
    let players = [...group];
    const hasBye = players.length % 2 !== 0;
    if (hasBye) players = [...players, { id: 'BYE', seed: -1 }];
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
        if (a.id !== 'BYE' && b.id !== 'BYE') {
          allMatches.push(makeMatch(round, i, null, groupId, { kind: 'seed', seed: a.seed }, { kind: 'seed', seed: b.seed }, a.id, b.id));
        }
      }
      rotating.unshift(rotating.pop()!);
    }
  }

  return { id: makeId('stage'), format: 'round_robin', entrants, matches: resolveSlots(allMatches), settings: opts, status: 'in_progress' };
}

// ── Report / Undo ─────────────────────────────────────────────────────────────

export function reportResult(state: StageState, matchId: string, scoreA: number, scoreB: number): Result<StageState> {
  const matchIdx = state.matches.findIndex((m) => m.id === matchId);
  if (matchIdx === -1) return err({ code: 'MATCH_NOT_FOUND' });
  const match = state.matches[matchIdx];
  if (match.status === 'pending') return err({ code: 'MATCH_NOT_READY', matchId });
  if (scoreA === scoreB) return err({ code: 'NO_WINNER' });

  const winnerId = scoreA > scoreB ? match.entrantA! : match.entrantB!;
  const loserId = scoreA > scoreB ? match.entrantB : match.entrantA;

  const updatedMatch: Match = { ...match, scoreA, scoreB, winnerId, loserId: loserId ?? null, status: 'completed' };
  const newMatches = [...state.matches];
  newMatches[matchIdx] = updatedMatch;
  const resolved = resolveSlots(newMatches);
  const allDone = resolved.filter((m) => m.status !== 'completed').length === 0;

  return ok({ ...state, matches: resolved, status: allDone ? 'completed' : 'in_progress' });
}

export function undoResult(state: StageState, matchId: string): Result<StageState> {
  const matchIdx = state.matches.findIndex((m) => m.id === matchId);
  if (matchIdx === -1) return err({ code: 'MATCH_NOT_FOUND' });
  const match = state.matches[matchIdx];
  const downstreamIds = allDownstream(state, matchId);

  for (const id of downstreamIds) {
    const dm = state.matches.find((m) => m.id === id);
    if (dm && dm.status === 'completed') return err({ code: 'DOWNSTREAM_COMPLETED', matchId: id });
  }

  function isDependentOn(source: Match['sourceA'], mId: string): boolean {
    if (source.kind === 'winner' || source.kind === 'loser') {
      if ((source as any).matchId === mId) return true;
      const refMatch = state.matches.find((m) => m.id === (source as any).matchId);
      if (refMatch) return isDependentOn(refMatch.sourceA, mId) || isDependentOn(refMatch.sourceB, mId);
    }
    return false;
  }

  const newMatches = state.matches.map((m): Match => {
    if (m.id === matchId) {
      return { ...m, scoreA: null, scoreB: null, winnerId: null, loserId: null, status: m.entrantA !== null && m.entrantB !== null ? 'ready' : 'pending' };
    }
    if (downstreamIds.has(m.id)) {
      const clearA = isDependentOn(m.sourceA, matchId);
      const clearB = isDependentOn(m.sourceB, matchId);
      return { ...m, entrantA: clearA ? null : m.entrantA, entrantB: clearB ? null : m.entrantB, scoreA: null, scoreB: null, winnerId: null, loserId: null, status: 'pending' };
    }
    return m;
  });

  return ok({ ...state, matches: newMatches, status: 'in_progress' });
}

// ── Standings ─────────────────────────────────────────────────────────────────

export function computeStandings(state: StageState): Standing[] {
  const standingsMap = new Map<string, Standing>();
  for (const e of state.entrants) {
    standingsMap.set(e.id, { entrantId: e.id, place: 0, wins: 0, losses: 0, gameWins: 0, gameLosses: 0, headToHead: {} });
  }

  for (const match of state.matches) {
    if (match.status !== 'completed' || !match.winnerId) continue;
    const winnerS = standingsMap.get(match.winnerId);
    const loserId = match.loserId;
    const loserS = loserId ? standingsMap.get(loserId) : null;
    const isWinnerA = match.winnerId === match.entrantA;
    const winnerScore = isWinnerA ? match.scoreA : match.scoreB;
    const loserScore = isWinnerA ? match.scoreB : match.scoreA;

    if (winnerS) {
      winnerS.wins++;
      winnerS.gameWins += winnerScore ?? 0;
      winnerS.gameLosses += loserScore ?? 0;
      if (loserId) winnerS.headToHead[loserId] = 'win';
    }
    if (loserS && loserId) {
      loserS.losses++;
      loserS.gameLosses += winnerScore ?? 0;
      loserS.gameWins += loserScore ?? 0;
      loserS.headToHead[match.winnerId] = 'loss';
    }
  }

  const standings = [...standingsMap.values()];

  if (state.format === 'round_robin') {
    return [...standings].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const h2h = a.headToHead[b.entrantId];
      if (h2h === 'win') return -1;
      if (h2h === 'loss') return 1;
      const aGwp = a.gameWins / (a.gameWins + a.gameLosses || 1);
      const bGwp = b.gameWins / (b.gameWins + b.gameLosses || 1);
      return bGwp - aGwp;
    }).map((s, i) => ({ ...s, place: i + 1 }));
  }

  // Elimination: rank by which round the entrant was eliminated
  const lossRound = new Map<string, number>();
  for (const match of state.matches) {
    if (match.status !== 'completed' || !match.loserId) continue;
    const absRound = Math.abs(match.round);
    const prev = lossRound.get(match.loserId);
    if (prev === undefined || absRound > prev) lossRound.set(match.loserId, absRound);
  }
  const maxRound = Math.max(...[...lossRound.values()], 0);

  return [...standings].sort((a, b) => {
    const aRound = lossRound.get(a.entrantId) ?? maxRound + 1;
    const bRound = lossRound.get(b.entrantId) ?? maxRound + 1;
    return bRound - aRound;
  }).map((s, i) => ({ ...s, place: i + 1 }));
}
