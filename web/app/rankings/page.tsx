import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rankings — Bracket',
  description: 'Global player leaderboards and rankings.',
};

// Mock leaderboard cards
const leaderboards = [
  {
    id: 'ultrank',
    title: 'UltRank',
    subtitle: 'Half Year 2026',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    totalPlayers: 110,
    players: [
      { rank: 1, team: 'ZETA', name: 'acola', country: '🇯🇵' },
      { rank: 2, team: 'AREA3...', name: 'Doraright', country: '🇯🇵' },
      { rank: 3, team: 'E36', name: 'Hurt', country: '🇯🇵' },
      { rank: 4, team: '', name: 'Sonix', country: '🇺🇸' },
      { rank: 5, team: 'CTG', name: 'Zomba', country: '🇺🇸' },
      { rank: 6, team: 'FENNEL', name: 'Miya', country: '🇯🇵' },
      { rank: 7, team: '', name: 'Carmelo', country: '🇯🇵' },
    ]
  },
  {
    id: 'ssbmrank',
    title: 'SSBMRank',
    subtitle: 'Summer 2026',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
    totalPlayers: 100,
    players: [
      { rank: 1, team: 'SR', name: 'Zain', country: '🇺🇸' },
      { rank: 2, team: 'Envy', name: 'Wizzrobe', country: '🇺🇸' },
      { rank: 3, team: 'Liq...', name: 'Hungrybox', country: '🇺🇸' },
      { rank: 4, team: 'SR', name: 'moky', country: '🇨🇦' },
      { rank: 5, team: 'SR', name: 'Joshman', country: '🇦🇺' },
      { rank: 6, team: 'Eggdog', name: 'Salt', country: '🇺🇸' },
      { rank: 7, team: 'L...', name: 'RapMonster', country: '🇺🇸' },
    ]
  },
  {
    id: 'sf6rank',
    title: 'Fighter V Global',
    subtitle: 'Season 2026',
    imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=800&auto=format&fit=crop',
    totalPlayers: 150,
    players: [
      { rank: 1, team: 'RB', name: 'Daigo', country: '🇯🇵' },
      { rank: 2, team: 'FLY', name: 'Punk', country: '🇺🇸' },
      { rank: 3, team: 'ROHTO', name: 'Tokido', country: '🇯🇵' },
      { rank: 4, team: 'NASR', name: 'AngryBird', country: '🇦🇪' },
      { rank: 5, team: 'NASR', name: 'BigBird', country: '🇦🇪' },
      { rank: 6, team: 'MOUZ', name: 'EndingWalker', country: '🇬🇧' },
      { rank: 7, team: 'RC', name: 'MenaRD', country: '🇩🇴' },
    ]
  },
  {
    id: 'tekkenrank',
    title: 'Iron Fist Circuit',
    subtitle: 'World Tour 2026',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    totalPlayers: 120,
    players: [
      { rank: 1, team: 'DRX', name: 'Knee', country: '🇰🇷' },
      { rank: 2, team: 'FATE', name: 'Arslan Ash', country: '🇵🇰' },
      { rank: 3, team: 'KDF', name: 'Meo-IL', country: '🇰🇷' },
      { rank: 4, team: 'RB', name: 'Anakin', country: '🇺🇸' },
      { rank: 5, team: 'THY', name: 'Chikurin', country: '🇯🇵' },
      { rank: 6, team: 'T1', name: 'JDCR', country: '🇰🇷' },
      { rank: 7, team: 'GL', name: 'Super Akouma', country: '🇫🇷' },
    ]
  }
];

export default function RankingsPage() {
  return (
    <main className="container fade-in" style={{ paddingTop: 32, paddingBottom: 80 }}>
      
      {/* ── Filter Toolbar ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="topbar-search" style={{ margin: 0, background: 'var(--bg-elevated)' }}>
          <span style={{ opacity: 0.5 }}>🔍</span>
          <input type="text" placeholder="Search rankings" />
        </div>
        
        <button className="btn btn-secondary btn-sm" style={{ height: 40, background: 'var(--bg-elevated)' }}>
          Location ⌄
        </button>
        <button className="btn btn-secondary btn-sm" style={{ height: 40, background: 'var(--bg-elevated)' }}>
          Filters ⌄
        </button>
        <button className="btn btn-secondary btn-sm" style={{ height: 40, background: 'var(--bg-elevated)' }}>
          Choose your game ⌄
        </button>
        
        <button className="btn btn-primary" style={{ height: 40, background: '#3B75DF', color: '#fff', borderColor: '#3B75DF' }}>
          Create ranking
        </button>
      </div>
      
      {/* Active filters pill */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <div className="badge badge-neutral" style={{ padding: '6px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
          Past Year <span style={{ cursor: 'pointer', opacity: 0.6 }}>✖</span>
        </div>
      </div>

      {/* ── Rankings Grid ─────────────────────────────────────── */}
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
                  <div key={p.rank} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', width: 16, textAlign: 'right' }}>
                      {p.rank}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 14 }}>
                        {p.team && <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>{p.team}</span>}
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, opacity: 0.7 }}>
                        <span style={{ fontSize: 12 }}>{p.country}</span>
                        {/* Mock social icons */}
                        <span style={{ fontSize: 10 }}>🐦</span>
                        <span style={{ fontSize: 10 }}>🎮</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column (Ranks 5 to 7 + View All) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {board.players.slice(4, 7).map(p => (
                  <div key={p.rank} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', width: 16, textAlign: 'right' }}>
                      {p.rank}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 14 }}>
                        {p.team && <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>{p.team}</span>}
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, opacity: 0.7 }}>
                        <span style={{ fontSize: 12 }}>{p.country}</span>
                        <span style={{ fontSize: 10 }}>🐦</span>
                        <span style={{ fontSize: 10 }}>🎮</span>
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

    </main>
  );
}
