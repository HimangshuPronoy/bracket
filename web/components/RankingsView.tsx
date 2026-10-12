'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface Player {
  rank: number;
  team: string;
  name: string;
  country: string;
  wins: number;
}

interface Leaderboard {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  totalPlayers: number;
  players: Player[];
}

interface Props {
  leaderboards: Leaderboard[];
}

export default function RankingsView({ leaderboards }: Props) {
  const { t } = useI18n();

  return (
    <main className="container fade-in" style={{ paddingTop: 32, paddingBottom: 80 }}>
      
      <div style={{ marginBottom: 32 }}>
        <h1 className="text-display">{t('rankings.title')}</h1>
        <p className="text-secondary text-body mt-2">{t('rankings.subtitle')}</p>
      </div>

      {leaderboards.length === 0 ? (
        <div className="card empty-state" style={{ padding: 64, textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h2 className="text-display" style={{ fontSize: 24, marginBottom: 8 }}>{t('rankings.emptyTitle')}</h2>
          <p className="text-body text-secondary" style={{ maxWidth: 400, margin: '0 auto' }}>
            {t('rankings.emptyDesc')}
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
                        {p.wins} {t('rankings.wins')}
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
                        {p.wins} {t('rankings.wins')}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* View All Block */}
                <div style={{ marginTop: 'auto', marginLeft: 28, paddingBottom: 4 }}>
                  <Link href={`/rankings/${board.id}`} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
                    <span style={{ color: '#3B75DF', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {t('home.viewAll')}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                      {board.totalPlayers}
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
