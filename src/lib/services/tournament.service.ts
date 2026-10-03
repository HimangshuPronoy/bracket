// =============================================================================
// Tournament Service – CRUD + discover/search
// =============================================================================
import { supabase } from '../supabase';
import type {
  Tournament,
  TournamentWithEvents,
  TournamentInsert,
  TournamentUpdate,
  TournamentStatus,
} from '../database.types';

const TOURNAMENT_WITH_EVENTS_SELECT = `
  *,
  events (*)
`;

// ─── Discover / Search ────────────────────────────────────────────────────────

export interface DiscoverFilters {
  search?: string;
  game?: string;
  isOnline?: boolean;
  status?: TournamentStatus;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export async function discoverTournaments(
  filters: DiscoverFilters = {}
): Promise<TournamentWithEvents[]> {
  const { search, game, isOnline, status, tags, limit = 20, offset = 0 } = filters;

  let query = supabase
    .from('tournaments')
    .select(TOURNAMENT_WITH_EVENTS_SELECT)
    .not('status', 'eq', 'draft')
    .order('starts_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.textSearch('fts', search, { type: 'websearch' });
  }
  if (game) {
    query = query.ilike('game', `%${game}%`);
  }
  if (isOnline !== undefined) {
    query = query.eq('is_online', isOnline);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as TournamentWithEvents[];
}

export async function getFeaturedTournaments(): Promise<TournamentWithEvents[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(TOURNAMENT_WITH_EVENTS_SELECT)
    .overlaps('tags', ['Featured'])
    .in('status', ['registration_open', 'in_progress'])
    .order('starts_at', { ascending: true })
    .limit(5);

  if (error) throw error;
  return data as TournamentWithEvents[];
}

// ─── Single tournament ────────────────────────────────────────────────────────

export async function getTournamentById(id: string): Promise<TournamentWithEvents | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(TOURNAMENT_WITH_EVENTS_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as TournamentWithEvents;
}

export async function getTournamentBySlug(slug: string): Promise<TournamentWithEvents | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(TOURNAMENT_WITH_EVENTS_SELECT)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as TournamentWithEvents;
}

// ─── Organizer CRUD ───────────────────────────────────────────────────────────

export async function getMyTournaments(organizerId: string): Promise<TournamentWithEvents[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select(TOURNAMENT_WITH_EVENTS_SELECT)
    .eq('organizer_id', organizerId)
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return data as TournamentWithEvents[];
}

export interface OrganizerStats {
  tournament_id: string;
  organizer_id: string;
  name: string;
  status: string;
  starts_at: string;
  registration_count: number;
  checked_in_count: number;
  open_dispute_count: number;
  gross_revenue: number;
}

export async function getOrganizerStats(organizerId: string): Promise<OrganizerStats[]> {
  const { data, error } = await supabase
    .from('organizer_tournament_stats')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return data as OrganizerStats[];
}

export async function createTournament(payload: TournamentInsert): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Tournament;
}

export async function updateTournament(id: string, updates: TournamentUpdate): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Tournament;
}

export async function deleteTournament(id: string): Promise<void> {
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}

/** Upload a banner image and return the public URL */
export async function uploadTournamentBanner(
  organizerId: string,
  tournamentId: string,
  uri: string
): Promise<string> {
  const ext = uri.split('.').pop() ?? 'jpg';
  const path = `${organizerId}/${tournamentId}/banner.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const { error } = await supabase.storage
    .from('tournament-banners')
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: `image/${ext}`,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('tournament-banners').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Helper: generate a URL-safe slug ────────────────────────────────────────
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
    + '-' + Math.random().toString(36).slice(2, 7);
}
