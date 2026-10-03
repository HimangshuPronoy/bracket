// =============================================================================
// React Query hooks – registrations
// =============================================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyRegistrations,
  getRegistrationForTournament,
  getTournamentRegistrations,
  registerForTournament,
  updateRegistrationEvents,
  cancelRegistration,
  checkInPlayer,
} from '../lib/services/registration.service';
import { tournamentKeys } from './useTournaments';
import type { Registration } from '../lib/database.types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const registrationKeys = {
  all: ['registrations'] as const,
  mine: (userId: string) => [...registrationKeys.all, 'mine', userId] as const,
  tournament: (tournamentId: string) => [...registrationKeys.all, 'tournament', tournamentId] as const,
  userTournament: (userId: string, tournamentId: string) =>
    [...registrationKeys.all, 'userTournament', userId, tournamentId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useMyRegistrations(userId: string | null) {
  return useQuery({
    queryKey: registrationKeys.mine(userId ?? ''),
    queryFn: () => getMyRegistrations(userId!),
    enabled: !!userId,
    staleTime: 20_000,
  });
}

export function useRegistrationForTournament(userId: string | null, tournamentId: string | null) {
  return useQuery({
    queryKey: registrationKeys.userTournament(userId ?? '', tournamentId ?? ''),
    queryFn: () => getRegistrationForTournament(userId!, tournamentId!),
    enabled: !!userId && !!tournamentId,
    staleTime: 15_000,
  });
}

export function useTournamentRegistrations(tournamentId: string | null) {
  return useQuery({
    queryKey: registrationKeys.tournament(tournamentId ?? ''),
    queryFn: () => getTournamentRegistrations(tournamentId!),
    enabled: !!tournamentId,
    staleTime: 15_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useRegisterForTournament() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: registerForTournament,
    onSuccess: (registration: Registration) => {
      qc.invalidateQueries({ queryKey: registrationKeys.mine(registration.user_id) });
      qc.invalidateQueries({
        queryKey: registrationKeys.userTournament(registration.user_id, registration.tournament_id),
      });
      // Refetch tournament to get updated entrant counts
      qc.invalidateQueries({ queryKey: tournamentKeys.detail(registration.tournament_id) });
    },
  });
}

export function useUpdateRegistrationEvents() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ registrationId, eventIds }: { registrationId: string; eventIds: string[] }) =>
      updateRegistrationEvents(registrationId, eventIds),
    onSuccess: (registration: Registration) => {
      qc.invalidateQueries({ queryKey: registrationKeys.mine(registration.user_id) });
    },
  });
}

export function useCancelRegistration() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ registrationId, userId, tournamentId }: { registrationId: string; userId: string; tournamentId: string }) =>
      cancelRegistration(registrationId),
    onSuccess: (_, { userId, tournamentId }) => {
      qc.invalidateQueries({ queryKey: registrationKeys.mine(userId) });
      qc.invalidateQueries({ queryKey: registrationKeys.userTournament(userId, tournamentId) });
      qc.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) });
    },
  });
}

export function useCheckInPlayer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: checkInPlayer,
    onSuccess: (_, registrationId) => {
      // Invalidate the tournament registrations list (organizer view)
      qc.invalidateQueries({ queryKey: registrationKeys.all });
    },
  });
}
