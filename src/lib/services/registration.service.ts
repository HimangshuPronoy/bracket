// =============================================================================
// Registration Service – register, cancel, check-in, waitlist
// =============================================================================
import { supabase } from '../supabase';
import type { Registration, RegistrationWithTournament } from '../database.types';

const REGISTRATION_WITH_DETAILS_SELECT = `
  *,
  tournament:tournaments (*),
  events:tournaments (events (*))
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Get all of the current user's registrations with tournament + event details */
export async function getMyRegistrations(userId: string): Promise<RegistrationWithTournament[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      tournament:tournaments (
        *,
        events (*)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .order('registered_at', { ascending: false });

  if (error) throw error;
  
  // Flatten the nested structure: extract events array from the joined tournament
  const mapped = (data ?? []).map((row: any) => ({
    ...row,
    events: row.tournament?.events ?? [],
  }));
  return mapped as unknown as RegistrationWithTournament[];
}

/** Check if the current user is registered for a tournament */
export async function getRegistrationForTournament(
  userId: string,
  tournamentId: string
): Promise<Registration | null> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', userId)
    .eq('tournament_id', tournamentId)
    .maybeSingle();

  if (error) throw error;
  return data as Registration | null;
}

/** Get all registrations for a tournament (organizer view) */
export async function getTournamentRegistrations(tournamentId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*, profile:profiles(display_name, handle, avatar_url)')
    .eq('tournament_id', tournamentId)
    .order('registered_at', { ascending: true });

  if (error) throw error;
  return data as unknown as Registration[];
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  userId: string;
  tournamentId: string;
  eventIds: string[];
}

/**
 * Register a user for a tournament. If a cancelled registration already exists,
 * it will be reactivated (upsert). Returns the registration row.
 */
export async function registerForTournament(payload: RegisterPayload): Promise<Registration> {
  const { userId, tournamentId, eventIds } = payload;

  const { data, error } = await supabase
    .from('registrations')
    .upsert(
      {
        user_id: userId,
        tournament_id: tournamentId,
        event_ids: eventIds,
        status: 'confirmed',
        checked_in: false,
      },
      { onConflict: 'user_id,tournament_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as Registration;
}

/** Update which events the user is registered for */
export async function updateRegistrationEvents(
  registrationId: string,
  eventIds: string[]
): Promise<Registration> {
  const { data, error } = await supabase
    .from('registrations')
    .update({ event_ids: eventIds })
    .eq('id', registrationId)
    .select()
    .single();

  if (error) throw error;
  return data as Registration;
}

/** Cancel a registration (sets status = 'cancelled') */
export async function cancelRegistration(registrationId: string): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .update({ status: 'cancelled' })
    .eq('id', registrationId);

  if (error) throw error;
}

/** Organizer marks a player as checked-in */
export async function checkInPlayer(registrationId: string): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .update({ checked_in: true })
    .eq('id', registrationId);

  if (error) throw error;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

/** Subscribe to registration changes for a tournament (organizer dashboard) */
export function subscribeTournamentRegistrations(
  tournamentId: string,
  onInsert: (reg: Registration) => void,
  onUpdate: (reg: Registration) => void
): () => void {
  const channel = supabase
    .channel(`registrations:${tournamentId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'registrations',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => onInsert(payload.new as Registration)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'registrations',
        filter: `tournament_id=eq.${tournamentId}`,
      },
      (payload) => onUpdate(payload.new as Registration)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
