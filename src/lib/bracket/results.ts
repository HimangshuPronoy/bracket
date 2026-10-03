// ---------------------------------------------------------------------------
// Bracket Engine – reportResult / undoResult
// ---------------------------------------------------------------------------
import { BracketEngineError, Match, Result, StageState, err, ok } from './types';
import { allDownstream, resolveSlots } from './utils';

/** Report the result of a match. Returns the updated stage or an error. */
export function reportResult(
  state: StageState,
  matchId: string,
  scoreA: number,
  scoreB: number
): Result<StageState> {
  const matchIdx = state.matches.findIndex((m) => m.id === matchId);
  if (matchIdx === -1) return err({ code: 'MATCH_NOT_FOUND' });

  const match = state.matches[matchIdx];
  if (match.status === 'pending') return err({ code: 'MATCH_NOT_READY', matchId });

  if (scoreA === scoreB) return err({ code: 'NO_WINNER' });

  const winnerId = scoreA > scoreB ? match.entrantA! : match.entrantB!;
  const loserId = scoreA > scoreB ? match.entrantB : match.entrantA;

  const updatedMatch: Match = {
    ...match,
    scoreA,
    scoreB,
    winnerId,
    loserId: loserId ?? null,
    status: 'completed',
  };

  const newMatches = [...state.matches];
  newMatches[matchIdx] = updatedMatch;

  // Propagate winner/loser into downstream matches and re-resolve byes
  const resolved = resolveSlots(newMatches);

  // Check if all matches completed → stage done
  const stageCompleted = resolved.every(
    (m) => m.status === 'completed' || m.status === 'pending'
  );
  const allDone = resolved.filter((m) => m.status !== 'completed').length === 0;

  return ok({
    ...state,
    matches: resolved,
    status: allDone ? 'completed' : 'in_progress',
  });
}

/** Undo a match result. Returns error if downstream matches are already played. */
export function undoResult(
  state: StageState,
  matchId: string
): Result<StageState> {
  const matchIdx = state.matches.findIndex((m) => m.id === matchId);
  if (matchIdx === -1) return err({ code: 'MATCH_NOT_FOUND' });

  const match = state.matches[matchIdx];

  // Collect all downstream match IDs
  const downstreamIds = allDownstream(state, matchId);

  // Check if any downstream match has been played (completed)
  for (const id of downstreamIds) {
    const dm = state.matches.find((m) => m.id === id);
    if (dm && dm.status === 'completed') {
      return err({ code: 'DOWNSTREAM_COMPLETED', matchId: id });
    }
  }

  // Reset this match and all downstream matches
  const newMatches = state.matches.map((m): Match => {
    if (m.id === matchId) {
      return {
        ...m,
        scoreA: null,
        scoreB: null,
        winnerId: null,
        loserId: null,
        status: m.entrantA !== null && m.entrantB !== null ? 'ready' : 'pending',
      };
    }
    if (downstreamIds.has(m.id)) {
      // Reset to pending, clear any propagated entrants from this match's winner/loser
      const clearA = isDependentOn(m.sourceA, matchId, state);
      const clearB = isDependentOn(m.sourceB, matchId, state);
      return {
        ...m,
        entrantA: clearA ? null : m.entrantA,
        entrantB: clearB ? null : m.entrantB,
        scoreA: null,
        scoreB: null,
        winnerId: null,
        loserId: null,
        status: 'pending',
      };
    }
    return m;
  });

  return ok({
    ...state,
    matches: newMatches,
    status: 'in_progress',
  });
}

function isDependentOn(
  source: Match['sourceA'],
  matchId: string,
  state: StageState
): boolean {
  if (source.kind === 'winner' || source.kind === 'loser') {
    if ((source as any).matchId === matchId) return true;
    // Transitive: check if that match itself depends on matchId
    const refMatch = state.matches.find((m) => m.id === (source as any).matchId);
    if (refMatch) {
      return (
        isDependentOn(refMatch.sourceA, matchId, state) ||
        isDependentOn(refMatch.sourceB, matchId, state)
      );
    }
  }
  return false;
}
