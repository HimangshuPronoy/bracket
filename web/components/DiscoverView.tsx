'use client';

import { useState } from 'react';
import Link from 'next/link';
import Carousel from './Carousel';
import { useI18n } from '@/lib/i18n';

interface Props {
  mappedTournaments: any[];
}

export default function DiscoverView({ mappedTournaments }: Props) {
  const { t } = useI18n();

  // Active state for showcase expanding cards
  const [activeAccordionIndex, setActiveAccordionIndex] = useState<number>(0);

  // Filter real tournaments directly from database
  const trending = mappedTournaments.slice(0, 8);
  const fightingGames = mappedTournaments.filter((t: any) => 
    t.game?.toLowerCase().includes('fighter') || 
    t.game?.toLowerCase().includes('melee') || 
    t.game?.toLowerCase().includes('bros') || 
    t.game?.toLowerCase().includes('smash') || 
    t.game?.toLowerCase().includes('tekken') || 
    t.game?.toLowerCase().includes('mortal')
  ).slice(0, 8);
  
  const shooters = mappedTournaments.filter((t: any) => 
    t.game?.toLowerCase().includes('fortnite') || 
    t.game?.toLowerCase().includes('overwatch') || 
    t.game?.toLowerCase().includes('valorant') || 
    t.game?.toLowerCase().includes('strike') || 
    t.game?.toLowerCase().includes('shooter') || 
    t.game?.toLowerCase().includes('halo') || 
    t.game?.toLowerCase().includes('cs2') ||
    t.game?.toLowerCase().includes('apex')
  ).slice(0, 8);

  const otherGames = mappedTournaments.filter((t: any) => 
    !fightingGames.some(f => f.id === t.id) && 
    !shooters.some(s => s.id === t.id)
  );

  // ONLY real database tournaments in showcase (no mock data)
  const showcaseTournaments = mappedTournaments.slice(0, 4);

  // Active index for featured hero card (allows cycling through real tournaments)
  const [featuredHeroIndex, setFeaturedHeroIndex] = useState<number>(0);
  const featuredHeroTournament = mappedTournaments.length > 0 
    ? mappedTournaments[featuredHeroIndex % mappedTournaments.length] 
    : null;

  const nextFeatured = () => {
    if (mappedTournaments.length > 1) {
      setFeaturedHeroIndex((prev) => (prev + 1) % mappedTournaments.length);
    }
  };

  const prevFeatured = () => {
    if (mappedTournaments.length > 1) {
      setFeaturedHeroIndex((prev) => (prev - 1 + mappedTournaments.length) % mappedTournaments.length);
    }
  };

  const getGameEmoji = (game?: string) => {
    const g = (game || '').toLowerCase();
    if (g.includes('fortnite')) return '🪂';
    if (g.includes('overwatch')) return '🛡️';
    if (g.includes('fighter') || g.includes('sf')) return '🥊';
    if (g.includes('melee') || g.includes('smash')) return '⚔️';
    if (g.includes('valorant') || g.includes('strike') || g.includes('cs')) return '🎯';
    if (g.includes('rocket')) return '🚗';
    if (g.includes('league') || g.includes('lol')) return '🧙';
    if (g.includes('apex')) return '⚡';
    return '🏆';
  };

  const supportedGames = [
    { name: 'Fortnite', genre: 'Battle Royale', query: 'fortnite', icon: '🪂' },
    { name: 'Overwatch 2', genre: 'Hero Shooter', query: 'overwatch', icon: '🛡️' },
    { name: 'Valorant', genre: 'Tactical Shooter', query: 'valorant', icon: '🎯' },
    { name: 'Counter-Strike 2', genre: 'Tactical FPS', query: 'cs2', icon: '💣' },
    { name: 'Super Smash Bros', genre: 'Platform Fighter', query: 'smash', icon: '⚔️' },
    { name: 'Rocket League', genre: 'Vehicular Soccer', query: 'rocket', icon: '🚗' },
    { name: 'League of Legends', genre: 'MOBA', query: 'league', icon: '🧙' },
    { name: 'Apex Legends', genre: 'Battle Royale', query: 'apex', icon: '⚡' },
  ];

  return (
    <main className="container fade-in">
      
      {/* ── 1. Split-Screen Hero (Flat Solid, Real Data Only) ── */}
      <section className="hero-split-grid">
        {/* Left Column: Authentic Value Proposition & Actions */}
        <div className="hero-content-col">
          <div className="section-kicker">
            <span>⚡</span>
            <span>COMPETITIVE ESPORTS PLATFORM</span>
          </div>

          <h1 className="hero-headline">
            Where Players Compete & <br />
            <span style={{ color: 'var(--text-secondary)' }}>Organizers Run Brackets.</span>
          </h1>

          <p className="hero-subline">
            Discover open community and pro tournaments, register with one click, and follow real-time swiss and elimination brackets.
          </p>

          <div className="hero-actions">
            <a href="#tournaments" className="btn btn-primary btn-lg">
              Explore Tournaments →
            </a>
            <Link href="/create" className="btn btn-secondary btn-lg">
              Host a Tournament
            </Link>
          </div>

          {/* Real Platform Statistics (No fake metrics) */}
          <div className="hero-metrics-row">
            <div className="hero-metric-item">
              <span className="hero-metric-num">{mappedTournaments.length}</span>
              <span className="hero-metric-label">Active Tournaments</span>
            </div>
            <div className="hero-metric-item">
              <span className="hero-metric-num">100%</span>
              <span className="hero-metric-label">Free Seeding Engine</span>
            </div>
            <div className="hero-metric-item">
              <span className="hero-metric-num">Live</span>
              <span className="hero-metric-label">Bracket Sync</span>
            </div>
          </div>
        </div>

        {/* Right Column: Real Tournament from Database (Zero Mock Data, No Gradients) */}
        <div>
          {featuredHeroTournament ? (
            <div className="featured-hero-card">
              {/* Header with Switcher & Live Badge */}
              <div className="featured-hero-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    FEATURED TOURNAMENT
                  </span>
                  {mappedTournaments.length > 1 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', background: '#E2E8F0', padding: '2px 8px', borderRadius: 4 }}>
                      {((featuredHeroIndex % mappedTournaments.length) + 1).toString().padStart(2, '0')} / {mappedTournaments.length.toString().padStart(2, '0')}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {mappedTournaments.length > 1 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button 
                        onClick={prevFeatured}
                        title="Previous event"
                        style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          color: '#0F172A', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'background 0.2s'
                        }}
                      >
                        ‹
                      </button>
                      <button 
                        onClick={nextFeatured}
                        title="Next event"
                        style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          color: '#0F172A', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'background 0.2s'
                        }}
                      >
                        ›
                      </button>
                    </div>
                  )}

                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    fontSize: 10, 
                    fontWeight: 650, 
                    color: featuredHeroTournament.registrationOpen ? '#059669' : '#DC2626',
                    background: featuredHeroTournament.registrationOpen ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${featuredHeroTournament.registrationOpen ? '#A7F3D0' : '#FECACA'}`,
                    padding: '3px 10px', 
                    borderRadius: 'var(--radius-pill)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                    {featuredHeroTournament.registrationOpen ? 'Registration Open' : 'Registration Closed'}
                  </span>
                </div>
              </div>

              {/* Segmented Quick Switcher for Multiple Tournaments */}
              {mappedTournaments.length > 1 && (
                <div className="featured-tab-strip">
                  {mappedTournaments.map((t: any, idx: number) => {
                    const isActive = idx === (featuredHeroIndex % mappedTournaments.length);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setFeaturedHeroIndex(idx)}
                        className={`featured-tab-btn ${isActive ? 'active' : ''}`}
                        type="button"
                      >
                        <span>{getGameEmoji(t.game)}</span>
                        <span>{t.name}</span>
                        <span style={{ fontSize: 10, opacity: 0.7 }}>({t.game})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Framed Inset Image Banner */}
              <div className="featured-hero-visual" style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {featuredHeroTournament.imageUrl ? (
                  <img 
                    src={featuredHeroTournament.imageUrl} 
                    alt={featuredHeroTournament.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 48 }}>{getGameEmoji(featuredHeroTournament.game)}</span>
                    <span style={{ 
                      fontSize: 13, 
                      fontWeight: 700, 
                      color: 'rgba(255,255,255,0.7)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase'
                    }}>
                      {featuredHeroTournament.game}
                    </span>
                  </div>
                )}
                
                {/* Floating Game Chip on Image */}
                <div style={{ position: 'absolute', top: 12, left: 12 }}>
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.03em'
                  }}>
                    <span>{getGameEmoji(featuredHeroTournament.game)}</span>
                    <span>{featuredHeroTournament.game}</span>
                  </span>
                </div>

                {/* Floating Fee Chip on Image */}
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <span style={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    color: '#34D399',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {featuredHeroTournament.registrationFee === 0 ? 'Free Entry' : `$${featuredHeroTournament.registrationFee} USD`}
                  </span>
                </div>

                {/* Floating Verified Badge on Image */}
                <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(15, 23, 42, 0.88)', 
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#E2E8F0',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 10,
                    fontWeight: 500
                  }}>
                    <span style={{ color: '#38BDF8' }}>✓</span> Verified Platform Bracket
                  </span>
                </div>
              </div>

              {/* Tournament Details & Actions */}
              <div className="featured-hero-body">
                <div>
                  <h3 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                    {featuredHeroTournament.name}
                  </h3>
                  <div style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', 
                      background: '#0F172A', border: '1px solid #CBD5E1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FFFFFF', fontSize: 11, fontWeight: 600
                    }}>
                      {(featuredHeroTournament.organizerName || 'O').charAt(0).toUpperCase()}
                    </div>
                    <span>Hosted by</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{featuredHeroTournament.organizerName}</span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ color: '#64748B', fontSize: 12 }}>Official Host</span>
                  </div>
                </div>

                {/* Modern Spec Grid (Replaced spreadsheet box) */}
                <div className="featured-spec-grid">
                  <div className="featured-spec-card">
                    <span className="featured-spec-label">
                      <span>📅</span> Starts
                    </span>
                    <span className="featured-spec-value">
                      {featuredHeroTournament.date}
                    </span>
                  </div>

                  <div className="featured-spec-card">
                    <span className="featured-spec-label">
                      <span>{featuredHeroTournament.isOnline ? '🌐' : '📍'}</span> Format
                    </span>
                    <span className="featured-spec-value">
                      {featuredHeroTournament.isOnline ? 'Online Bracket' : featuredHeroTournament.location}
                    </span>
                  </div>

                  <div className="featured-spec-card">
                    <span className="featured-spec-label">
                      <span>👥</span> Entrants
                    </span>
                    <span className="featured-spec-value">
                      {featuredHeroTournament.entrantsCount} Registered
                    </span>
                  </div>
                </div>

                {/* Tournament Feature Highlights */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 16,
                  fontSize: 12, 
                  color: '#64748B',
                  padding: '4px 0'
                }}>
                  <span>⚡ Swiss & Elimination</span>
                  <span>•</span>
                  <span>🏆 Live Bracket Sync</span>
                  <span>•</span>
                  <span>📡 Auto Match Calls</span>
                </div>

                <Link 
                  href={`/tournament/${featuredHeroTournament.id}`} 
                  className="featured-cta-btn"
                  style={{ 
                    width: '100%', 
                    textDecoration: 'none', 
                    height: 48,
                    fontSize: 14,
                    fontWeight: 650,
                    letterSpacing: '-0.01em',
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.18)'
                  }}
                >
                  View Tournament Details & Register →
                </Link>

                <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center' }}>
                  🔒 Instant registration • No platform fees • Open to all players
                </div>
              </div>
            </div>
          ) : (
            <div className="featured-hero-card" style={{ padding: '36px', textAlign: 'center', background: '#FFFFFF', color: '#0F172A' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🏆</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                Host Your First Tournament
              </h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
                Launch single elimination, double elimination, or swiss brackets with automated station routing and zero platform fees.
              </p>
              <Link href="/create" className="featured-cta-btn" style={{ textDecoration: 'none', display: 'inline-flex', padding: '12px 24px', borderRadius: 9999 }}>
                + Create Tournament Now
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Featured Tournaments Showcase (Real Data, Clean Solid Design) ── */}
      {showcaseTournaments.length > 0 && (
        <section style={{ margin: '96px 0 110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <div className="section-kicker">FEATURED SPOTLIGHT</div>
              <h2 className="text-display" style={{ fontSize: 32 }}>Championship Circuits</h2>
            </div>
            <span className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Select a tournament to view details
            </span>
          </div>

          <div className="cr7-accordion-stage">
            {showcaseTournaments.map((t, idx) => {
              const isActive = activeAccordionIndex === idx;
              return (
                <div 
                  key={`showcase-${t.id}`}
                  className={`cr7-column ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setActiveAccordionIndex(idx)}
                  onClick={() => setActiveAccordionIndex(idx)}
                >
                  {t.imageUrl ? (
                    <img 
                      src={t.imageUrl} 
                      alt={t.name}
                      className="cr7-img"
                    />
                  ) : (
                    <div className="cr7-img" style={{
                      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}>
                      <span style={{ fontSize: 36 }}>{getGameEmoji(t.game)}</span>
                    </div>
                  )}
                  
                  {/* Clean label for inactive card */}
                  <div className="cr7-inactive-tag">
                    {t.game}
                  </div>

                  {/* Active expanded card content */}
                  <div className="cr7-overlay">
                    <div className="cr7-details-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ 
                          background: t.registrationOpen ? '#ECFDF5' : '#FEF2F2', 
                          color: t.registrationOpen ? '#059669' : '#DC2626', 
                          border: `1px solid ${t.registrationOpen ? '#A7F3D0' : '#FECACA'}`,
                          padding: '4px 10px', 
                          fontSize: 11, 
                          fontWeight: 650, 
                          borderRadius: 'var(--radius-pill)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          ● {t.registrationOpen ? 'Registration Open' : 'Registration Closed'}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                          {t.game}
                        </span>
                      </div>

                      <h3 style={{ 
                        fontSize: 26, 
                        fontWeight: 700, 
                        color: '#0F172A', 
                        margin: '0 0 8px 0', 
                        letterSpacing: '-0.025em',
                        lineHeight: 1.25 
                      }}>
                        {t.name}
                      </h3>

                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                        📅 {t.date} • {t.isOnline ? '🌐 Global Online' : `📍 ${t.location}`} {t.prizePool ? `• 🏆 ${t.prizePool}` : ''}
                      </p>

                      <Link 
                        href={`/tournament/${t.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none', display: 'inline-flex' }}
                      >
                        Enter Tournament →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 3. Categorized Tournament Carousels (Real Tournaments Only) ── */}
      <div id="tournaments">
        {mappedTournaments.length === 0 ? (
          <div className="card" style={{ padding: 64, textAlign: 'center', margin: '48px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
            <h2 className="text-display" style={{ fontSize: 24, marginBottom: 8 }}>{t('home.noTournaments')}</h2>
            <p className="text-body text-secondary" style={{ maxWidth: 440, margin: '0 auto 24px' }}>
              {t('home.noTournamentsDesc')}
            </p>
            <Link href="/create" className="btn btn-primary">
              Create the First Tournament
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {trending.length > 0 && (
              <Carousel 
                kicker="LIVE NOW & UPCOMING" 
                title={t('home.trending')} 
                tournaments={trending} 
                viewAllHref="/search" 
              />
            )}
            
            {fightingGames.length > 0 && (
              <Carousel 
                kicker="FIGHTING GAME COMMUNITY" 
                title={t('home.fightingGames')} 
                tournaments={fightingGames} 
                viewAllHref="/search?q=fighter" 
              />
            )}

            {shooters.length > 0 && (
              <Carousel 
                kicker="FPS & TACTICAL ESPORTS" 
                title={t('home.shooters')} 
                tournaments={shooters} 
                viewAllHref="/search?q=shooter" 
              />
            )}

            {otherGames.length > 0 && (
              <Carousel 
                kicker="MORE DISCIPLINES" 
                title={t('home.moreTournaments')} 
                tournaments={otherGames} 
                viewAllHref="/search" 
              />
            )}
          </div>
        )}
      </div>

      {/* ── 4. Apex Marketing 4-Step Architecture Pipeline (Pure Solids) ── */}
      <section style={{ margin: '110px 0 96px' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
          <div className="section-kicker">COMPETITIVE WORKFLOW</div>
          <h2 className="text-display" style={{ fontSize: 38, marginBottom: 14 }}>How Bracket Works</h2>
          <p className="text-body" style={{ fontSize: 16 }}>
            Engineered for elite competitors, trusted by tournament directors and community organizers worldwide.
          </p>
        </div>

        <div className="apex-pipeline-grid">
          <div className="apex-step-card">
            <div className="apex-numeral">01</div>
            <h3 className="apex-step-title">Discover Events</h3>
            <p className="apex-step-desc">
              Browse upcoming local and global online brackets across your favorite titles with real-time entrant counts and format specifications.
            </p>
          </div>

          <div className="apex-step-card">
            <div className="apex-numeral">02</div>
            <h3 className="apex-step-title">One-Click Entry</h3>
            <p className="apex-step-desc">
              Secure your seed with instant registration. Pick singles or doubles pools, review rulebooks, and manage your digital entrant passes.
            </p>
          </div>

          <div className="apex-step-card">
            <div className="apex-numeral">03</div>
            <h3 className="apex-step-title">Real-Time Brackets</h3>
            <p className="apex-step-desc">
              Follow dynamically updated swiss, single-elimination, and double-elimination brackets with automatic station routing and match calls.
            </p>
          </div>

          <div className="apex-step-card">
            <div className="apex-numeral">04</div>
            <h3 className="apex-step-title">Verified Standings</h3>
            <p className="apex-step-desc">
              Report scores with dispute validation, earn verified circuit ranking points, and ascend regional and global leaderboards.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Haute / CR7 Razor-Bordered Ecosystem Grid (Zero Gradients) ── */}
      <section style={{ margin: '96px 0 110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <div className="section-kicker">SUPPORTED DISCIPLINES</div>
            <h2 className="text-display" style={{ fontSize: 30 }}>Competitive Ecosystem</h2>
          </div>
          <Link href="/search" style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            View All Games →
          </Link>
        </div>

        <div className="ecosystem-grid">
          {supportedGames.map((game) => (
            <Link 
              key={game.name}
              href={`/search?q=${game.query}`}
              className="ecosystem-cell"
            >
              <div className="ecosystem-icon">{game.icon}</div>
              <div className="ecosystem-name">{game.name}</div>
              <div className="ecosystem-genre">{game.genre}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 6. Organizer Callout Card (Solid Surface, Zero Gradients) ── */}
      <section style={{ marginBottom: 60 }}>
        <div className="organizer-callout-box">
          <div>
            <div className="section-kicker" style={{ color: '#818CF8' }}>FOR TOURNAMENT DIRECTORS</div>
            <h2 className="text-display" style={{ fontSize: 36, marginBottom: 16 }}>
              Ready to organize your next championship?
            </h2>
            <p className="text-body" style={{ fontSize: 16, marginBottom: 32, maxWidth: 540 }}>
              Launch single elimination, double elimination, swiss, or round-robin brackets in minutes. Complete with automated seeding, station assignment, and real-time score updates.
            </p>
            <div className="mobile-stack-buttons" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/create" className="btn btn-primary btn-lg">
                Create a Tournament Now →
              </Link>
              <Link href="/organizer" className="btn btn-secondary btn-lg">
                Organizer Dashboard
              </Link>
            </div>
          </div>

          <div className="hide-mobile" style={{ 
            background: '#F8FAFC', 
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px 28px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>⚡🏆</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>100% Free Seeding Engine</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Zero platform cut for grassroots and community tournaments. Instant bracket generation, entrant ticketing, and match verification.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
