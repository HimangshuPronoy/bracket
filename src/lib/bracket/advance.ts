// ---------------------------------------------------------------------------
// Bracket Engine – advanceToNextStage
//
// Takes the top `advancingCount` from the previous stage's standings and
// seeds them into a new stage. Avoids same-pool/group rematches in round 1
// where possible (for round-robin → elimination transitions).
// ---------------------------------------------------------------------------
import { Entrant, NextStageConfig, StageState } from './types';
import { computeStandings } from './standings';
import { generateSingleElim } from './singleElim';
import { generateDoubleElim } from './doubleElim';
import { generateRoundRobin } from './roundRobin';

export function advanceToNextStage(
  prevStage: StageState,
  nextConfig: NextStageConfig
): StageState {
  const standings = computeStandings(prevStage);
  const advancing = standings
    .filter((s) => s.place <= nextConfig.advancingCount)
    .sort((a, b) => a.place - b.place);

  // Build entrant list preserving the place order (place 1 = seed 1)
  let entrants: Entrant[] = advancing.map((s, i) => ({
    id: s.entrantId,
    seed: i + 1,
  }));

  // ── Same-pool rematch avoidance for RR → Elim ────────────────────────────
  // If the previous stage was round-robin with groups, try to separate entrants
  // from the same group in the first round by reordering seeds.
  if (prevStage.format === 'round_robin' && prevStage.settings.groupCount) {
    entrants = separatePools(entrants, prevStage, advancing.map((s) => s.entrantId));
  }

  // ── Generate next stage ───────────────────────────────────────────────────
  const settings = nextConfig.settings ?? {};

  switch (nextConfig.format) {
    case 'single_elim':
      return { ...generateSingleElim(entrants, settings), id: nextConfig.id };
    case 'double_elim':
      return { ...generateDoubleElim(entrants, settings), id: nextConfig.id };
    case 'round_robin':
      return { ...generateRoundRobin(entrants, settings), id: nextConfig.id };
    default:
      return { ...generateSingleElim(entrants, settings), id: nextConfig.id };
  }
}

/** Reorder seeds to minimize first-round same-pool matchups.
 *  Strategy: snake the groups into seed positions. If group A had 2 winners
 *  and group B had 2, interleave: A1 B1 A2 B2 → seeds 1 2 3 4.
 */
function separatePools(
  entrants: Entrant[],
  prevStage: StageState,
  advancingIds: string[]
): Entrant[] {
  // Build a map: entrantId → groupId
  const entrantGroup = new Map<string, string>();
  for (const match of prevStage.matches) {
    if (!match.groupId) continue;
    if (match.entrantA) entrantGroup.set(match.entrantA, match.groupId);
    if (match.entrantB) entrantGroup.set(match.entrantB, match.groupId);
  }

  // Group advancing entrants by their pool
  const pools = new Map<string, string[]>();
  for (const id of advancingIds) {
    const gid = entrantGroup.get(id) ?? 'unknown';
    if (!pools.has(gid)) pools.set(gid, []);
    pools.get(gid)!.push(id);
  }

  // Interleave pools (round-robin across pools)
  const poolArrays = [...pools.values()];
  const reordered: string[] = [];
  const maxLen = Math.max(...poolArrays.map((p) => p.length));
  for (let i = 0; i < maxLen; i++) {
    for (const pool of poolArrays) {
      if (i < pool.length) reordered.push(pool[i]);
    }
  }

  return reordered.map((id, i) => ({ id, seed: i + 1 }));
}
