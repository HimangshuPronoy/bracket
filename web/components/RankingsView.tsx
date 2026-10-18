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
      
      <div style={{ marginBottom: 40 }}>
        <div className="section-kicker">GLOBAL CIRCUIT STANDINGS</div>
        <h1 className="text-display" style={{ fontSize: 36 }}>{t('rankings.title')}</h1>
        <p className="text-secondary text-body mt-2" style={{ fontSize: 16 }}>{t('rankings.subtitle')}</p>
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
          {leaderboards.map((board) => (
            <div 
              key={board.id} 
              className="card" 
              style={{ 
                padding: 0, 
                display: 'flex', 
                flexDirection: 'column',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              {/* Hero Image Header */}
              <div style={{ 
                position: 'relative', 
                height: 140, 
                width: '100%', 
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}>
                {board.imageUrl ? (
                  <>
                    <img 
                      src={board.imageUrl} 
                      alt={board.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      background: 'rgba(7, 8, 14, 0.72)' 
                    }} />
                  </>
                ) : null}
                
                <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: '#818CF8', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.08em' 
                  }}>
                    {board.subtitle}
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '2px 0 0' }}>
                    {board.title}
                  </h2>
                </div>
              </div>

              {/* Players List Grid (Left: 1-4, Right: 5-7 + View All) */}
              <div className="rankings-player-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                padding: '20px', 
                gap: 16,
                background: 'var(--bg-surface)' 
              }}>
                {/* Left Column (Ranks 1 to 4) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {board.players.slice(0, 4).map((p) => {
                    const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `${p.rank}`;
                    return (
                      <div key={p.rank} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ 
                          fontSize: p.rank <= 3 ? 16 : 13, 
                          color: p.rank === 1 ? '#D97706' : p.rank === 2 ? '#64748B' : p.rank === 3 ? '#EA580C' : 'var(--text-muted)', 
                          width: 20, 
                          textAlign: 'center', 
                          fontWeight: 700 
                        }}>
                          {medal}
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
                    );
                  })}
                </div>

                {/* Right Column (Ranks 5 to 7 + View All) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {board.players.slice(4, 7).map((p) => (
                    <div key={p.rank} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', width: 20, textAlign: 'center', fontWeight: 600 }}>
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
                  <div style={{ marginTop: 'auto', paddingLeft: 32, paddingBottom: 4 }}>
                    <Link 
                      href={`/rankings/${board.id}`} 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: 6,
                        color: 'var(--accent)', 
                        fontWeight: 700, 
                        fontSize: 13,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      <span>{t('home.viewAll')}</span>
                      <span>→</span>
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
