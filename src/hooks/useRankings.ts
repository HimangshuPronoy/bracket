// =============================================================================
// React Query hooks – rankings
// =============================================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserRankings,
  getEventLeaderboard,
  recordRanking,
  recordBracketResults,
} from '../lib/services/ranking.service';
import type { RankingInsert, Ranking } from '../lib/database.types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const rankingKeys = {
  all: ['rankings'] as const,
  user: (userId: string) => [...rankingKeys.all, 'user', userId] as const,
  event: (eventId: string) => [...rankingKeys.all, 'event', eventId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useUserRankings(userId: string | null) {
  return useQuery({
    queryKey: rankingKeys.user(userId ?? ''),
    queryFn: () => getUserRankings(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useEventLeaderboard(eventId: string | null, limit = 32) {
  return useQuery({
    queryKey: rankingKeys.event(eventId ?? ''),
    queryFn: () => getEventLeaderboard(eventId!, limit),
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useRecordRanking() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: recordRanking,
    onSuccess: (ranking: Ranking) => {
      qc.invalidateQueries({ queryKey: rankingKeys.user(ranking.user_id) });
      qc.invalidateQueries({ queryKey: rankingKeys.event(ranking.event_id) });
    },
  });
}

export function useRecordBracketResults() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      tournamentId,
      eventId,
      results,
    }: {
      tournamentId: string;
      eventId: string;
      results: Array<{ userId: string; placement: number; wins: number; losses: number }>;
    }) => recordBracketResults(tournamentId, eventId, results),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: rankingKeys.event(eventId) });
      qc.invalidateQueries({ queryKey: rankingKeys.all });
    },
  });
}
