// =============================================================================
// Ranking Service – placement records and player history
// =============================================================================
import { supabase } from '../supabase';
import type { Ranking, RankingWithDetails, RankingInsert } from '../database.types';

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Fetch all placements for a given user, with tournament + event info */
export async function getUserRankings(userId: string): Promise<RankingWithDetails[]> {
  const { data, error } = await supabase
    .from('rankings')
    .select(`
      *,
      tournament:tournaments (id, name, banner_url, game),
      event:events (id, name, entrants_count)
    `)
    .eq('user_id', userId)
    .order('placement', { ascending: true });

  if (error) throw error;
  return data as unknown as RankingWithDetails[];
}

/** Leaderboard: top N players for a given event */
export async function getEventLeaderboard(eventId: string, limit = 32): Promise<Ranking[]> {
  const { data, error } = await supabase
    .from('rankings')
    .select('*, profile:profiles(display_name, handle, avatar_url)')
    .eq('event_id', eventId)
    .order('placement', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as unknown as Ranking[];
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Record (or update) a final placement for a player in an event.
 * Organizer-only; RLS enforces this.
 */
export async function recordRanking(payload: RankingInsert): Promise<Ranking> {
  const { data, error } = await supabase
    .from('rankings')
    .upsert(payload, { onConflict: 'user_id,event_id' })
    .select()
    .single();

  if (error) throw error;
  return data as Ranking;
}

/**
 * Bulk-record placements from a completed bracket stage.
 * Accepts an array of { userId, placement, wins, losses }.
 */
export async function recordBracketResults(
  tournamentId: string,
  eventId: string,
  results: Array<{ userId: string; placement: number; wins: number; losses: number }>
): Promise<void> {
  const rows: RankingInsert[] = results.map((r) => ({
    user_id: r.userId,
    tournament_id: tournamentId,
    event_id: eventId,
    placement: r.placement,
    wins: r.wins,
    losses: r.losses,
  }));

  const { error } = await supabase
    .from('rankings')
    .upsert(rows, { onConflict: 'user_id,event_id' });

  if (error) throw error;
}
