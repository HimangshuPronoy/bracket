import type { Metadata } from 'next';
import { supabase, getGameBanner } from '@/lib/supabase';
import RankingsView from '@/components/RankingsView';

export const metadata: Metadata = {
  title: 'Rankings — Bracket',
  description: 'Global player leaderboards and rankings.',
};

export const revalidate = 0;

export default async function RankingsPage() {
  // Fetch real rankings from the database
  const { data: rankingsData } = await supabase
    .from('rankings')
    .select(`
      user_id,
      wins,
      tournaments ( game )
    `);

  // Fetch profiles resiliently
  const profilesMap = new Map<string, { display_name: string; handle: string }>();
  if (rankingsData && rankingsData.length > 0) {
    const userIds = Array.from(new Set(rankingsData.map((r: any) => r.user_id)));
    const { data: pData } = await supabase
      .from('profiles')
      .select('id, display_name, handle')
      .in('id', userIds);
    (pData || []).forEach((p: any) => profilesMap.set(p.id, p));
  }

  // Group by game
  const gamesMap = new Map<string, Map<string, { name: string; wins: number }>>();
  
  if (rankingsData) {
    rankingsData.forEach((row: any) => {
      const game = row.tournaments?.game;
      if (!game) return;
      const userId = row.user_id;
      const profile = profilesMap.get(userId);
      const name = profile?.display_name || profile?.handle || 'Player ' + userId.slice(0, 5);
      
      if (!gamesMap.has(game)) gamesMap.set(game, new Map());
      const playersMap = gamesMap.get(game)!;
      
      const current = playersMap.get(userId) || { name, wins: 0 };
      current.wins += (row.wins || 0);
      playersMap.set(userId, current);
    });
  }

  // Convert to leaderboards array
  const leaderboards = Array.from(gamesMap.entries()).map(([game, playersMap], index) => {
    const players = Array.from(playersMap.values())
      .sort((a, b) => b.wins - a.wins)
      .map((p, i) => ({
        rank: i + 1,
        team: '',
        name: p.name,
        country: '🏳️',
        wins: p.wins
      }));

    return {
      id: game.toLowerCase().replace(/\s+/g, '-'),
      title: `${game} Global`,
      subtitle: 'Current Standings',
      imageUrl: getGameBanner(game),
      totalPlayers: players.length,
      players
    };
  });

  return <RankingsView leaderboards={leaderboards} />;
}
