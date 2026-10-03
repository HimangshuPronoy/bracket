// ---------------------------------------------------------------------------
// Bracket Engine – Domain Types
// All IDs are strings (UUID-compatible). No React or Supabase imports here.
// ---------------------------------------------------------------------------

export type BracketFormat = 'single_elim' | 'double_elim' | 'round_robin' | 'swiss';
export type BracketSide = 'winners' | 'losers' | 'grand_final' | null;
export type MatchStatus = 'pending' | 'ready' | 'in_progress' | 'completed';
export type StageStatus = 'pending' | 'in_progress' | 'completed';

// An entrant is any participant (player or team) with a seed.
export interface Entrant {
  id: string;
  seed: number; // 1-based
}

// Represents one match slot – what is known about where a participant comes from.
export type SlotSource =
  | { kind: 'seed'; seed: number }
  | { kind: 'winner'; matchId: string }
  | { kind: 'loser'; matchId: string }
  | { kind: 'bye' }
  | { kind: 'tbd' }; // unknown until seeding is resolved

export interface Match {
  id: string;
  round: number;      // positive = winners, negative = losers, 0 = grand final
  position: number;   // 0-based position within the round
  side: BracketSide;
  groupId: string | null;

  entrantA: string | null; // entrant id (null = not yet known / bye)
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
  // Single / Double Elim
  thirdPlaceMatch?: boolean;
  grandFinalReset?: boolean;

  // Round Robin
  groupCount?: number;  // number of round-robin groups

  // Swiss
  rounds?: number;
}

export interface Standing {
  entrantId: string;
  place: number;
  wins: number;
  losses: number;
  // For round robin tiebreaking
  gameWins: number;
  gameLosses: number;
  headToHead: Record<string, 'win' | 'loss' | 'draw'>;
}

export interface NextStageConfig {
  id: string;
  format: BracketFormat;
  advancingCount: number;
  settings?: StageSettings;
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
