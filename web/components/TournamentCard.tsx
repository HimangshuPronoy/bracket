'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface Props {
  tournament: any;
}

export default function TournamentCard({ tournament }: Props) {
  const { t } = useI18n();

  return (
    <Link 
      href={`/tournament/${tournament.id}`} 
      className="card card-interactive" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        padding: 0, 
        textDecoration: 'none',
        height: '100%',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      {/* Thumbnail Container */}
      <div style={{ position: 'relative', width: '100%', height: 180, overflow: 'hidden' }}>
        <img
          src={tournament.imageUrl}
          alt={tournament.name}
          className="card-thumbnail"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Border divider line instead of gradient */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />

        {/* Floating Registration Badge */}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          {tournament.registrationOpen ? (
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#ECFDF5', 
              color: '#059669', 
              border: '1px solid #A7F3D0',
              padding: '4px 10px', 
              fontSize: 11, 
              fontWeight: 700, 
              letterSpacing: '0.04em',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <span className="status-dot" style={{ background: '#059669', width: 6, height: 6 }} />
              {t('tournament.registrationOpen')}
            </span>
          ) : (
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#FEF2F2', 
              color: '#DC2626', 
              border: '1px solid #FECACA',
              padding: '4px 10px', 
              fontSize: 11, 
              fontWeight: 700, 
              letterSpacing: '0.04em',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <span className="status-dot" style={{ background: '#DC2626', width: 6, height: 6 }} />
              {t('tournament.registrationClosed')}
            </span>
          )}
        </div>

        {/* Fee Pill on Top Right */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          {tournament.registrationFee === 0 ? (
            <span style={{ 
              background: '#ECFDF5', 
              color: '#059669', 
              border: '1px solid #A7F3D0',
              padding: '4px 10px', 
              fontSize: 11, 
              fontWeight: 700, 
              borderRadius: 'var(--radius-pill)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              {t('tournament.freeEntry')}
            </span>
          ) : (
            <span style={{ 
              background: '#FFFFFF', 
              color: '#0F172A', 
              border: '1px solid #E2E8F0',
              padding: '4px 10px', 
              fontSize: 11, 
              fontWeight: 700, 
              borderRadius: 'var(--radius-pill)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              ${tournament.registrationFee} USD
            </span>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          {/* Game Tag & Icon Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {tournament.thumbnailUrl && (
              <img 
                src={tournament.thumbnailUrl} 
                alt="Game thumbnail"
                style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }}
              />
            )}
            <span style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.06em' 
            }}>
              {tournament.game}
            </span>
          </div>

          {/* Tournament Name */}
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            color: 'var(--text)', 
            margin: '0 0 12px 0', 
            letterSpacing: '-0.015em',
            lineHeight: 1.3
          }}>
            {tournament.name}
          </h3>
        </div>
        
        {/* Metadata Footer */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 8, 
          paddingTop: 14, 
          borderTop: '1px solid var(--border)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ opacity: 0.8 }}>📅</span> {tournament.date}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ opacity: 0.8 }}>{tournament.isOnline ? '🌐' : '📍'}</span> {tournament.location}
            </span>
          </div>

          {tournament.entrantsCount !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              <span>👥 {tournament.entrantsCount} entrants</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                View Bracket <span style={{ transition: 'transform 0.2s' }}>›</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
