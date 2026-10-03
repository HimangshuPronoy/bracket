// ---------------------------------------------------------------------------
// Bracket Engine – computeStandings
// ---------------------------------------------------------------------------
import { Match, StageState, Standing } from './types';

export function computeStandings(state: StageState): Standing[] {
  const entrantIds = state.entrants.map((e) => e.id);
  const standingsMap = new Map<string, Standing>();

  // Initialize
  for (const id of entrantIds) {
    standingsMap.set(id, {
      entrantId: id,
      place: 0,
      wins: 0,
      losses: 0,
      gameWins: 0,
      gameLosses: 0,
      headToHead: {},
    });
  }

  // Tally from completed matches
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
    return rankRoundRobin(standings, state);
  }

  if (state.format === 'single_elim' || state.format === 'double_elim') {
    return rankElimination(standings, state);
  }

  // Fallback: sort by wins desc
  return standings
    .sort((a, b) => b.wins - a.wins)
    .map((s, i) => ({ ...s, place: i + 1 }));
}

// ── Round Robin ranking ────────────────────────────────────────────────────
function rankRoundRobin(standings: Standing[], state: StageState): Standing[] {
  // Primary: wins. Secondary: head-to-head. Tertiary: game win %.
  const sorted = [...standings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    // Head-to-head
    const h2h = a.headToHead[b.entrantId];
    if (h2h === 'win') return -1;
    if (h2h === 'loss') return 1;
    // Game win %
    const aGwp = a.gameWins / (a.gameWins + a.gameLosses || 1);
    const bGwp = b.gameWins / (b.gameWins + b.gameLosses || 1);
    return bGwp - aGwp;
  });

  return assignPlaces(sorted);
}

// ── Elimination ranking ───────────────────────────────────────────────────
// Place is determined by which round the entrant lost (or if they won the final).
function rankElimination(standings: Standing[], state: StageState): Standing[] {
  const lossRound = new Map<string, number>(); // entrantId → round they lost in (abs)

  for (const match of state.matches) {
    if (match.status !== 'completed' || !match.loserId) continue;
    const prevLoss = lossRound.get(match.loserId);
    const absRound = Math.abs(match.round);
    // Keep the highest (latest) round loss
    if (prevLoss === undefined || absRound > prevLoss) {
      lossRound.set(match.loserId, absRound);
    }
  }

  // Winner has no loss
  const maxRound = Math.max(...[...lossRound.values()], 0);

  const sorted = [...standings].sort((a, b) => {
    const aRound = lossRound.get(a.entrantId) ?? maxRound + 1;
    const bRound = lossRound.get(b.entrantId) ?? maxRound + 1;
    return bRound - aRound; // later exit = better place
  });

  return assignPlaces(sorted);
}

function assignPlaces(sorted: Standing[]): Standing[] {
  return sorted.map((s, i) => ({ ...s, place: i + 1 }));
}
