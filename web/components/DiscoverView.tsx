'use client';

import Link from 'next/link';
import Carousel from './Carousel';
import { useI18n } from '@/lib/i18n';

interface Props {
  mappedTournaments: any[];
}

export default function DiscoverView({ mappedTournaments }: Props) {
  const { t } = useI18n();

  const trending = mappedTournaments.slice(0, 6);
  const fightingGames = mappedTournaments.filter((t: any) => t.game?.includes('Fighter') || t.game?.includes('Bros') || t.game?.includes('Smash') || t.game?.includes('Tekken')).slice(0, 6);
  const shooters = mappedTournaments.filter((t: any) => t.game?.includes('Valorant') || t.game?.includes('Strike') || t.game?.includes('Shooter') || t.game?.includes('Halo') || t.game?.includes('CS2')).slice(0, 6);
  const otherGames = mappedTournaments.filter((t: any) => 
    !fightingGames.some(f => f.id === t.id) && 
    !shooters.some(s => s.id === t.id)
  );

  const featured = mappedTournaments[0] || trending[0];

  return (
    <main className="container fade-in">
      {/* Featured Hero */}
      {featured && (
        <Link href={`/tournament/${featured.id}`} style={{ display: 'block', textDecoration: 'none', marginBottom: 48 }}>
          <div style={{ position: 'relative', width: '100%', height: 360, borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <img 
              src={featured.imageUrl} 
              alt={featured.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 32, left: 32, right: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-accent mb-2">{t('home.featuredEvent')}</span>
                <h1 className="text-display" style={{ fontSize: 40, marginBottom: 8, color: '#fff' }}>{featured.name}</h1>
                <p className="text-body" style={{ color: 'rgba(255,255,255,0.7)' }}>{featured.game} • {featured.location}</p>
              </div>
              <button className="btn btn-primary">
                {t('home.registerNow')}
              </button>
            </div>
          </div>
        </Link>
      )}

      <div className="flex-col gap-8">
        {mappedTournaments.length === 0 ? (
          <div className="card empty-state" style={{ padding: 64, textAlign: 'center', marginTop: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
            <h2 className="text-display" style={{ fontSize: 24, marginBottom: 8 }}>{t('home.noTournaments')}</h2>
            <p className="text-body text-secondary" style={{ maxWidth: 400, margin: '0 auto' }}>
              {t('home.noTournamentsDesc')}
            </p>
          </div>
        ) : (
          <>
            {trending.length > 0 && <Carousel title={t('home.trending')} tournaments={trending} viewAllHref="/search" />}
            {fightingGames.length > 0 && <Carousel title={t('home.fightingGames')} tournaments={fightingGames} viewAllHref="/search?q=fighter" />}
            {shooters.length > 0 && <Carousel title={t('home.shooters')} tournaments={shooters} viewAllHref="/search?q=shooter" />}
            {otherGames.length > 0 && (
              <Carousel title={t('home.moreTournaments')} tournaments={otherGames} viewAllHref="/search" />
            )}
          </>
        )}
      </div>
    </main>
  );
}
