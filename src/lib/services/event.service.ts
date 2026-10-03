// =============================================================================
// Event Service – sub-bracket events within a tournament
// =============================================================================
import { supabase } from '../supabase';
import type { Event, EventInsert, EventUpdate, EventFormat } from '../database.types';
import type { StageState } from '../bracket/types';

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getEventsByTournament(tournamentId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Event[];
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Event;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createEvent(payload: EventInsert): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Event;
}

export async function updateEvent(eventId: string, updates: EventUpdate): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data as Event;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

// ─── Bracket stage_data ──────────────────────────────────────────────────────

/**
 * Persist the in-memory bracket engine state back to the DB.
 * Typically called after every match result.
 */
export async function saveStageData(eventId: string, stageState: StageState): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ stage_data: stageState as any, status: stageState.status })
    .eq('id', eventId);

  if (error) throw error;
}

/**
 * Load the stage_data from DB and cast it back to a typed StageState.
 * Returns null if the event has not started yet.
 */
export async function loadStageData(eventId: string): Promise<StageState | null> {
  const event = await getEventById(eventId);
  if (!event || !event.stage_data) return null;
  return event.stage_data as unknown as StageState;
}

// ─── Realtime subscription ────────────────────────────────────────────────────

/**
 * Subscribe to live updates for a single event (bracket state changes).
 * Returns an unsubscribe function.
 */
export function subscribeToEvent(
  eventId: string,
  onUpdate: (event: Event) => void
): () => void {
  const channel = supabase
    .channel(`event:${eventId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
      (payload) => onUpdate(payload.new as Event)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export const EVENT_FORMAT_LABELS: Record<EventFormat, string> = {
  single_elim: 'Single Elimination',
  double_elim: 'Double Elimination',
  round_robin: 'Round Robin',
  swiss: 'Swiss',
};
