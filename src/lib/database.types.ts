// =============================================================================
// Bracket – Supabase Database Types
// Mirrors the database schema. Extend as tables evolve.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ───────────────────────────────────────────────────────────────────
export type TournamentStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type EventFormat = 'single_elim' | 'double_elim' | 'round_robin' | 'swiss';
export type EventStatus = 'pending' | 'seeding' | 'in_progress' | 'completed';
export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'refunded';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

// ─── Table row types ──────────────────────────────────────────────────────────

export interface Profile {
  id: string;            // uuid, matches auth.users.id
  display_name: string;
  handle: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Tournament {
  id: string;
  organizer_id: string;
  name: string;
  slug: string;
  game: string;
  description_md: string | null;
  banner_url: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  is_online: boolean;
  location: string | null;
  starts_at: string;       // ISO timestamp
  ends_at: string | null;
  registration_fee: number;
  prize_pool: string | null;
  max_entrants: number | null;
  status: TournamentStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  tournament_id: string;
  name: string;
  format: EventFormat;
  max_entrants: number | null;
  entrants_count: number;
  status: EventStatus;
  stage_data: Json | null;
  created_at: string;
}

export interface Registration {
  id: string;
  user_id: string;
  tournament_id: string;
  event_ids: string[];
  status: RegistrationStatus;
  checked_in: boolean;
  registered_at: string;
}

export interface Ranking {
  id: string;
  user_id: string;
  tournament_id: string;
  event_id: string;
  placement: number;
  wins: number;
  losses: number;
  recorded_at: string;
}

export interface Dispute {
  id: string;
  tournament_id: string;
  event_id: string;
  reported_by: string | null;
  match_id: string | null;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Joined / extended types (returned by queries with selects) ───────────────

export interface TournamentWithEvents extends Tournament {
  events: Event[];
}

export interface RegistrationWithTournament extends Registration {
  tournament: Tournament;
  events: Event[];
}

export interface RankingWithDetails extends Ranking {
  tournament: Pick<Tournament, 'id' | 'name' | 'banner_url' | 'game'>;
  event: Pick<Event, 'id' | 'name' | 'entrants_count'>;
}

// ─── Insert / Update payloads ─────────────────────────────────────────────────

export type TournamentInsert = Omit<Tournament, 'id' | 'created_at' | 'updated_at'>;
export type TournamentUpdate = Partial<TournamentInsert>;

export type EventInsert = Omit<Event, 'id' | 'entrants_count' | 'created_at'>;
export type EventUpdate = Partial<EventInsert>;

export type RegistrationInsert = Omit<Registration, 'id' | 'registered_at'>;

export type RankingInsert = Omit<Ranking, 'id' | 'recorded_at'>;

export type DisputeInsert = Omit<Dispute, 'id' | 'created_at' | 'updated_at'>;
export type DisputeUpdate = Partial<Pick<Dispute, 'status' | 'resolution'>>;

// ─── Organizer analytics view ──────────────────────────────────────────────────

export interface OrganizerTournamentStat {
  tournament_id: string;
  organizer_id: string;
  name: string;
  status: TournamentStatus;
  starts_at: string;
  registration_count: number;
  checked_in_count: number;
  open_dispute_count: number;
  gross_revenue: number;
}
