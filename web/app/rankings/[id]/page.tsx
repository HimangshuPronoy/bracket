import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gameName = id.replace(/-global$/, '').replace(/-/g, ' ');
  return {
    title: `${gameName.toUpperCase()} Global Rankings — Bracket`,
    description: `Complete leaderboard and player standings for ${gameName}.`,
  };
}

export default async function GameRankingsPage({ params }: Props) {
  const { id } = await params;

  // Fetch rankings
  const { data: rankingsData } = await supabase
    .from('rankings')
    .select(`
      user_id,
      wins,
      tournaments ( game )
    `);

  // Resilient profiles lookup
  const profilesMap = new Map<string, { display_name: string; handle: string; avatar_url: string }>();
  if (rankingsData && rankingsData.length > 0) {
    const userIds = Array.from(new Set(rankingsData.map((r: any) => r.user_id)));
    const { data: pData } = await supabase
      .from('profiles')
      .select('id, display_name, handle, avatar_url')
      .in('id', userIds);
    (pData || []).forEach((p: any) => profilesMap.set(p.id, p));
  }

  // Find matching game
  const gamesMap = new Map<string, Map<string, { name: string; handle: string; avatarUrl: string; wins: number }>>();

  if (rankingsData) {
    rankingsData.forEach((row: any) => {
      const game = row.tournaments?.game;
      if (!game) return;
      const gameSlug = game.toLowerCase().replace(/\s+/g, '-');
      const userId = row.user_id;
      const profile = profilesMap.get(userId);
      const name = profile?.display_name || profile?.handle || 'Player ' + userId.slice(0, 5);
      const handle = profile?.handle || '';
      const avatarUrl = profile?.avatar_url || '';

      if (!gamesMap.has(gameSlug)) gamesMap.set(gameSlug, new Map());
      const playersMap = gamesMap.get(gameSlug)!;

      const current = playersMap.get(userId) || { name, handle, avatarUrl, wins: 0 };
      current.wins += (row.wins || 0);
      playersMap.set(userId, current);
    });
  }

  // Look up by slug or slug-global
  const baseSlug = id.replace(/-global$/, '');
  const matchingKey = Array.from(gamesMap.keys()).find(k => k === id || k === baseSlug);

  const playersMap = matchingKey ? gamesMap.get(matchingKey) : null;
  const players = playersMap
    ? Array.from(playersMap.values())
        .sort((a, b) => b.wins - a.wins)
        .map((p, i) => ({ rank: i + 1, ...p }))
    : [];

  const displayGameName = matchingKey 
    ? matchingKey.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    : baseSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

  return (
    <main className="container fade-in" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 900 }}>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-secondary mb-6">
        <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Discover</Link>
        <span>/</span>
        <Link href="/rankings" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Rankings</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{displayGameName} Global</span>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h1 className="text-display">{displayGameName} Global Rankings</h1>
        <p className="text-secondary text-body mt-2">
          Verified player leaderboard based on competitive tournament match wins.
        </p>
      </div>

      {players.length === 0 ? (
        <div className="card empty-state" style={{ padding: 64, textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 className="text-display" style={{ fontSize: 24, marginBottom: 8 }}>No Players Ranked Yet</h2>
          <p className="text-body text-secondary" style={{ maxWidth: 440, margin: '0 auto 24px' }}>
            There are no recorded match results for {displayGameName} yet. Tournaments will automatically update this board upon completion.
          </p>
          <Link href="/rankings" className="btn btn-secondary">
            ← Return to All Rankings
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 120px',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div>Rank</div>
            <div>Player</div>
            <div style={{ textAlign: 'right' }}>Total Wins</div>
          </div>

          <div className="flex-col">
            {players.map(p => (
              <div
                key={p.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 120px',
                  alignItems: 'center',
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--border)',
                  background: p.rank <= 3 ? 'var(--tint-bg)' : 'transparent',
                }}
                className="hover-bg-elevated"
              >
                <div style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: p.rank === 1 ? '#FFD700' : p.rank === 2 ? '#C0C0C0' : p.rank === 3 ? '#CD7F32' : 'var(--text-muted)'
                }}>
                  {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700
                  }}>
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      p.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>
                      {p.name}
                    </div>
                    {p.handle && (
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        @{p.handle}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: 'var(--success)' }}>
                  {p.wins}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
