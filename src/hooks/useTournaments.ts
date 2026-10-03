// =============================================================================
// React Query hooks – tournaments
// =============================================================================
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  discoverTournaments,
  getFeaturedTournaments,
  getTournamentById,
  getMyTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  DiscoverFilters,
  slugify,
  getOrganizerStats,
} from '../lib/services/tournament.service';
import type { Tournament, TournamentWithEvents, TournamentInsert, TournamentUpdate } from '../lib/database.types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const tournamentKeys = {
  all: ['tournaments'] as const,
  lists: () => [...tournamentKeys.all, 'list'] as const,
  list: (filters: DiscoverFilters) => [...tournamentKeys.lists(), filters] as const,
  featured: () => [...tournamentKeys.all, 'featured'] as const,
  mine: (userId: string) => [...tournamentKeys.all, 'mine', userId] as const,
  details: () => [...tournamentKeys.all, 'detail'] as const,
  detail: (id: string) => [...tournamentKeys.details(), id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useDiscoverTournaments(filters: DiscoverFilters = {}) {
  return useQuery({
    queryKey: tournamentKeys.list(filters),
    queryFn: () => discoverTournaments(filters),
    staleTime: 30_000,
  });
}

export function useFeaturedTournaments() {
  return useQuery({
    queryKey: tournamentKeys.featured(),
    queryFn: getFeaturedTournaments,
    staleTime: 60_000,
  });
}

export function useTournament(id: string | null) {
  return useQuery({
    queryKey: tournamentKeys.detail(id ?? ''),
    queryFn: () => getTournamentById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useMyTournaments(organizerId: string | null) {
  return useQuery({
    queryKey: tournamentKeys.mine(organizerId ?? ''),
    queryFn: () => getMyTournaments(organizerId!),
    enabled: !!organizerId,
    staleTime: 20_000,
  });
}

export function useOrganizerStats(organizerId: string | null) {
  return useQuery({
    queryKey: [...tournamentKeys.all, 'stats', organizerId ?? ''],
    queryFn: () => getOrganizerStats(organizerId!),
    enabled: !!organizerId,
    staleTime: 20_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CreateTournamentInput {
  organizerId: string;
  name: string;
  game: string;
  isOnline: boolean;
  location?: string;
  startsAt: string;
  endsAt?: string;
  registrationFee?: number;
  prizePool?: string;
  maxEntrants?: number;
  descriptionMd?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  tags?: string[];
}

export function useCreateTournament() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTournamentInput) => {
      const payload: TournamentInsert = {
        organizer_id: input.organizerId,
        name: input.name,
        slug: slugify(input.name),
        game: input.game,
        is_online: input.isOnline,
        location: input.location ?? null,
        starts_at: input.startsAt,
        ends_at: input.endsAt ?? null,
        registration_fee: input.registrationFee ?? 0,
        prize_pool: input.prizePool ?? null,
        max_entrants: input.maxEntrants ?? null,
        description_md: input.descriptionMd ?? null,
        banner_url: input.bannerUrl ?? null,
        thumbnail_url: input.thumbnailUrl ?? null,
        video_url: input.videoUrl ?? null,
        tags: input.tags ?? [],
        status: 'registration_open',
      };
      return createTournament(payload);
    },
    onSuccess: (_, { organizerId }) => {
      qc.invalidateQueries({ queryKey: tournamentKeys.mine(organizerId) });
      qc.invalidateQueries({ queryKey: tournamentKeys.lists() });
    },
  });
}

export function useUpdateTournament() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TournamentUpdate }) =>
      updateTournament(id, updates),
    onSuccess: (tournament: Tournament) => {
      qc.setQueryData(tournamentKeys.detail(tournament.id), (old: TournamentWithEvents | undefined) =>
        old ? { ...old, ...tournament } : old
      );
      qc.invalidateQueries({ queryKey: tournamentKeys.mine(tournament.organizer_id) });
    },
  });
}

export function useDeleteTournament() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, organizerId }: { id: string; organizerId: string }) =>
      deleteTournament(id),
    onSuccess: (_, { id, organizerId }) => {
      qc.removeQueries({ queryKey: tournamentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tournamentKeys.mine(organizerId) });
      qc.invalidateQueries({ queryKey: tournamentKeys.lists() });
    },
  });
}
