'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase, mapTournament, type MappedTournament } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function OrganizerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myTournaments, setMyTournaments] = useState<MappedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ registrations: 0, revenue: 0 });

  const handlePublish = async (id: string) => {
    const { error } = await supabase.from('tournaments').update({ status: 'registration_open' }).eq('id', id);
    if (!error) {
      setMyTournaments(prev => prev.map(t => t.id === id ? { ...t, status: 'registration_open', registrationOpen: true } : t));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete tournament "${name}"? This action cannot be undone.`)) return;
    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) {
      alert(`Failed to delete tournament: ${error.message}`);
    } else {
      setMyTournaments(prev => prev.filter(t => t.id !== id));
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from('tournaments')
      .select('*')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        const tournaments = (data || []).map(mapTournament);
        setMyTournaments(tournaments);

        if (tournaments.length > 0) {
          const ids = tournaments.map(t => t.id);
          const { data: regRows } = await supabase
            .from('registrations')
            .select('tournament_id')
            .in('tournament_id', ids)
            .eq('status', 'confirmed');
          
          const regCount = regRows?.length ?? 0;
          const feeMap = new Map<string, number>(tournaments.map(t => [t.id, t.registrationFee ?? 0]));
          const totalRevenue = (regRows || []).reduce((sum, r: any) => sum + (feeMap.get(r.tournament_id) ?? 0), 0);

          setStats({
            registrations: regCount,
            revenue: totalRevenue,
          });
        }
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
        <h1 className="text-display" style={{ fontSize: 28, marginBottom: 12 }}>Sign in to access Organizer HQ</h1>
        <p className="text-secondary mb-6">Log in to manage your tournaments, view analytics, and handle registrations.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <Link href="/login" className="btn btn-primary btn-lg">Log In</Link>
          <Link href="/signup" className="btn btn-secondary btn-lg">Sign Up</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
      
      <div className="page-hero" style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="text-display">Organizer HQ</h1>
            <p className="text-body text-secondary mt-3">
              Actionable insights and management tools for your tournaments.
            </p>
          </div>
          <Link href="/create" className="btn btn-primary btn-lg">
            + New Event
          </Link>
        </div>
      </div>

      {myTournaments.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 32, padding: 64 }}>
          <div className="empty-icon" style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h2 className="text-title">No Events Yet</h2>
          <p className="text-body text-secondary mt-2 mb-6" style={{ maxWidth: 400, margin: '8px auto 24px' }}>
            Create your first tournament to start tracking registrations, managing brackets, and viewing analytics.
          </p>
          <Link href="/create" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
            + New Event
          </Link>
        </div>
      ) : (
        <div className="flex-col gap-8">

          {/* KPI Cards */}
          <section>
            <h2 className="text-title mb-4">Performance Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <div className="text-sm text-secondary mb-2" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tournaments</div>
                <div className="text-display" style={{ fontSize: 40 }}>{myTournaments.length}</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div className="text-sm text-secondary mb-2" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Registrations</div>
                <div className="text-display" style={{ fontSize: 40, color: 'var(--success)' }}>{stats.registrations}</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div className="text-sm text-secondary mb-2" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Revenue</div>
                <div className="text-display" style={{ fontSize: 40, color: 'var(--success)' }}>
                  ${stats.revenue.toFixed(0)}
                </div>
              </div>
            </div>
          </section>

          {/* Active Tournaments */}
          <section>
            <h2 className="text-title mb-4">My Tournaments</h2>
            <div className="card" style={{ padding: 0 }}>
              {myTournaments.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    padding: '24px',
                    borderBottom: i !== myTournaments.length - 1 ? '1px solid var(--border)' : 'none',
                    gap: 24
                  }}
                  className="hover-bg-elevated"
                >
                  <img
                    src={t.imageUrl}
                    alt={t.name}
                    style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                  />

                    <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 className="text-headline">{t.name}</h3>
                      <span className={`badge ${
                        t.status === 'registration_open' ? 'badge-success' :
                        t.status === 'in_progress' ? 'badge-accent' :
                        t.status === 'cancelled' ? 'badge-danger' :
                        'badge-neutral'
                      }`}>
                        {t.status === 'registration_open' ? 'Open' :
                         t.status === 'in_progress' ? 'In Progress' :
                         t.status === 'completed' ? 'Completed' :
                         t.status === 'cancelled' ? 'Cancelled' :
                         'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-secondary">{t.date} • {t.game}</p>
                    <p className="text-sm text-secondary mt-1">{t.isOnline ? '🌐 Online' : `📍 ${t.location}`}</p>
                  </div>

                  <div className="flex-col gap-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/tournament/${t.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ textAlign: 'center', textDecoration: 'none' }}
                      >
                        View
                      </Link>
                      <Link
                        href={`/tournament/${t.id}/edit`}
                        className="btn btn-secondary btn-sm"
                        style={{ textAlign: 'center', textDecoration: 'none' }}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id, t.name)}
                        className="btn btn-ghost btn-sm text-danger"
                        style={{ color: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    </div>
                    {(t.status === 'draft' || !t.registrationOpen) && t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'in_progress' && (
                      <button 
                        onClick={() => handlePublish(t.id)}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                      >
                        Publish 🚀
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}
    </main>
  );
}
