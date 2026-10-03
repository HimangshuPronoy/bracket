// =============================================================================
// Dispute Service – report and resolve match disputes
// =============================================================================
import { supabase } from '../supabase';
import type { Dispute, DisputeInsert, DisputeUpdate } from '../database.types';

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Organizer: get all disputes for a tournament */
export async function getTournamentDisputes(tournamentId: string): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from('disputes')
    .select('*, reporter:profiles!reported_by(display_name, handle, avatar_url)')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as Dispute[];
}

/** Player: get disputes I've filed */
export async function getMyDisputes(userId: string): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from('disputes')
    .select('*, tournament:tournaments(name), event:events(name)')
    .eq('reported_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as Dispute[];
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** File a new dispute */
export async function fileDispute(payload: DisputeInsert): Promise<Dispute> {
  const { data, error } = await supabase
    .from('disputes')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Dispute;
}

/** Organizer: update a dispute status / add resolution note */
export async function resolveDispute(disputeId: string, update: DisputeUpdate): Promise<Dispute> {
  const { data, error } = await supabase
    .from('disputes')
    .update(update)
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;
  return data as Dispute;
}
