'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, mapTournament, type MappedTournament } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';

type Registration = {
  id: string;
  tournament_id: string;
  status: string;
  created_at: string;
  tournament: MappedTournament;
};

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from('registrations')
      .select('*, tournament:tournaments(*)')
      .eq('user_id', user.id)
      .order('registered_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching registrations:', error);
          setLoading(false);
          return;
        }
        setRegistrations(
          (data || [])
            .filter((r: any) => !!r.tournament)
            .map((r: any) => ({
              ...r,
              tournament: mapTournament(r.tournament),
            }))
        );
        setLoading(false);
      });
  }, [user, authLoading]);

  const handleWithdraw = async (regId: string, tourName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t('myEvents.confirmWithdraw') || `Are you sure you want to withdraw from "${tourName}"?`)) return;
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'cancelled', event_ids: [] })
      .eq('id', regId);
    if (error) {
      alert(`Failed to withdraw: ${error.message}`);
    } else {
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'cancelled' } : r));
    }
  };

  if (authLoading || loading) {
    return (
      <main className="container fade-in" style={{ paddingTop: 80, textAlign: 'center' }}>
        <p className="text-secondary">{t('common.loading')}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container fade-in" style={{ paddingTop: 80, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 className="text-display" style={{ fontSize: 28, marginBottom: 12 }}>{t('settings.accountEmpty')}</h1>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <Link href="/login" className="btn btn-primary btn-lg">{t('nav.logIn')}</Link>
          <Link href="/signup" className="btn btn-secondary btn-lg">{t('nav.signUp')}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 720 }}>
      <div className="page-hero" style={{ paddingBottom: 24 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display">{t('myEvents.title')}</h1>
            <p className="text-body text-secondary mt-1">
              {t('myEvents.subtitle')}
            </p>
          </div>
          <div style={{ fontSize: 48, opacity: 0.8 }}>📅</div>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state card mt-6">
          <div className="empty-icon">📅</div>
          <h2 className="empty-title">{t('myEvents.emptyTitle')}</h2>
          <p className="empty-desc">{t('myEvents.emptyDesc')}</p>
          <Link href="/" className="btn btn-primary mt-4">{t('myEvents.browseTournaments')} →</Link>
        </div>
      ) : (
        <div className="flex-col gap-6">
          {registrations.map(({ id, tournament, status }) => (
            <Link
              key={id}
              href={`/tournament/${tournament.id}`}
              className="card card-interactive"
              style={{ display: 'block', overflow: 'hidden', padding: 0 }}
            >
              {/* Thumbnail Header */}
              <div style={{ position: 'relative', width: '100%', height: 160 }}>
                <img
                  src={tournament.imageUrl}
                  alt={tournament.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}>
                    <span style={{ color: '#0F172A', fontSize: 11, fontWeight: 700 }}>
                      {tournament.date}
                    </span>
                  </div>
                </div>
                {/* Status badge */}
                <div style={{ position: 'absolute', top: 12, left: 12 }}>
                  <span style={{
                    background: status === 'confirmed' ? '#ECFDF5' : status === 'cancelled' ? '#FEF2F2' : '#EFF6FF',
                    color: status === 'confirmed' ? '#059669' : status === 'cancelled' ? '#DC2626' : '#2563EB',
                    border: `1px solid ${status === 'confirmed' ? '#A7F3D0' : status === 'cancelled' ? '#FECACA' : '#BFDBFE'}`,
                    padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 'var(--radius-pill)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}>
                    {status === 'confirmed' ? '✓ Confirmed' : status === 'cancelled' ? '✕ Cancelled' : status?.toUpperCase() ?? 'REGISTERED'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: 24 }}>
                <h3 className="text-headline" style={{ marginBottom: 4 }}>{tournament.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ color: 'var(--text-secondary)' }}>🎮</span>
                  <span className="text-sm text-secondary">{tournament.game}</span>
                </div>

                {/* Footer / CTA */}
                <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--accent)' }}>{tournament.isOnline ? '🌐' : '📍'}</span>
                    <span className="text-sm text-secondary">
                      {tournament.isOnline ? 'Online' : 'In-Person'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'confirmed' && (
                      <>
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/tournament/${tournament.id}/register`;
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          Change Events
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleWithdraw(id, tournament.name, e)}
                          className="btn btn-ghost btn-sm text-danger"
                          style={{ color: 'var(--danger)' }}
                        >
                          {t('myEvents.withdraw')}
                        </button>
                      </>
                    )}
                    <span className="text-sm" style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: 8 }}>View Details →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
