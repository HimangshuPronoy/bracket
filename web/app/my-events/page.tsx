'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, mapTournament, type MappedTournament } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

type Registration = {
  id: string;
  tournament_id: string;
  status: string;
  created_at: string;
  tournament: MappedTournament;
};

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
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
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRegistrations(
          (data || []).map((r: any) => ({
            ...r,
            tournament: mapTournament(r.tournament),
          }))
        );
        setLoading(false);
      });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="container fade-in" style={{ paddingTop: 80, textAlign: 'center' }}>
        <p className="text-secondary">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container fade-in" style={{ paddingTop: 80, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 className="text-display" style={{ fontSize: 28, marginBottom: 12 }}>Sign in to view your events</h1>
        <p className="text-secondary mb-6">Log in or create an account to track your tournament registrations.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <Link href="/login" className="btn btn-primary btn-lg">Log In</Link>
          <Link href="/signup" className="btn btn-secondary btn-lg">Sign Up</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 720 }}>
      <div className="page-hero" style={{ paddingBottom: 24 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display">My Events</h1>
            <p className="text-body text-secondary mt-1">
              Tournaments you&apos;ve registered for.
            </p>
          </div>
          <div style={{ fontSize: 48, opacity: 0.8 }}>📅</div>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state card mt-6">
          <div className="empty-icon">📅</div>
          <h2 className="empty-title">No events yet</h2>
          <p className="empty-desc">You haven&apos;t registered for any tournaments. Head to Discover to find one.</p>
          <Link href="/" className="btn btn-primary mt-4">Browse Tournaments →</Link>
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
                    padding: '6px 12px',
                    borderRadius: 16,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                      {tournament.date}
                    </span>
                  </div>
                </div>
                {/* Status badge */}
                <div style={{ position: 'absolute', top: 12, left: 12 }}>
                  <span style={{
                    background: status === 'confirmed' ? 'var(--success)' : '#3B75DF',
                    color: status === 'confirmed' ? '#000' : '#fff',
                    padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 4
                  }}>
                    {status === 'confirmed' ? '✓ Confirmed' : status?.toUpperCase() ?? 'REGISTERED'}
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
                  <span className="text-sm" style={{ color: 'var(--accent)', fontWeight: 700 }}>View Details →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
