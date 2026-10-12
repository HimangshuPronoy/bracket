import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
      imageUrl: index % 2 === 0 
        ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
      totalPlayers: players.length,
      players
    };
  });
  return (
    <main className="container fade-in" style={{ paddingTop: 32, paddingBottom: 80 }}>
      
      <div style={{ marginBottom: 32 }}>
        <h1 className="text-display">Global Rankings</h1>
        <p className="text-secondary text-body mt-2">See how players stack up based on total tournament wins.</p>
      </div>

      {leaderboards.length === 0 ? (
        <div className="card empty-state" style={{ padding: 64, textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 className="text-display" style={{ fontSize: 24, marginBottom: 8 }}>No Rankings Yet</h2>
          <p className="text-body text-secondary" style={{ maxWidth: 400, margin: '0 auto' }}>
            There are no match results recorded in the database yet. Once players start winning tournaments, they will appear here!
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {leaderboards.map(board => (
            <div key={board.id} className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            
            {/* Hero Image Header */}
            <div style={{ position: 'relative', height: 180, width: '100%' }}>
              <img 
                src={board.imageUrl} 
                alt={board.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 80%)' }} />
              
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {board.title}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                  {board.subtitle}
                </p>
              </div>
            </div>

            {/* Players List Grid (Left: 1-4, Right: 5-7 + View All) */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              padding: 20, 
              gap: 16,
              background: 'var(--bg-surface)' 
            }}>
              
              {/* Left Column (Ranks 1 to 4) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {board.players.slice(0, 4).map(p => (
                  <div key={p.rank} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 14, color: p.rank === 1 ? '#FFD700' : p.rank === 2 ? '#C0C0C0' : p.rank === 3 ? '#CD7F32' : 'var(--text-muted)', width: 16, textAlign: 'right', fontWeight: 700 }}>
                      {p.rank}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {p.wins} {p.wins === 1 ? 'win' : 'wins'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column (Ranks 5 to 7 + View All) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {board.players.slice(4, 7).map(p => (
                  <div key={p.rank} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', width: 16, textAlign: 'right', fontWeight: 600 }}>
                      {p.rank}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {p.wins} {p.wins === 1 ? 'win' : 'wins'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* View All Block */}
                <div style={{ marginTop: 'auto', marginLeft: 28, paddingBottom: 4 }}>
                  <Link href={`/rankings/${board.id}`} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
                    <span style={{ color: '#3B75DF', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 4 }}>
                      View All <span>→</span>
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                      {board.totalPlayers} players
                    </span>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
      )}

    </main>
  );
}
