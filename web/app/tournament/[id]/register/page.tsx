'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

interface Props {
  params: Promise<{ id: string }>;
}

export default function RegisterPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [tournament, setTournament] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  
  useEffect(() => {
    async function load() {
      const { data: tData } = await supabase.from('tournaments').select('*').eq('id', id).single();
      if (!tData) {
        setLoading(false);
        return;
      }
      setTournament(tData);
      
      const { data: eData } = await supabase.from('events').select('*').eq('tournament_id', id);
      setEvents(eData || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading || authLoading) {
    return <main className="container fade-in" style={{ paddingTop: 40, textAlign: 'center' }}>Loading...</main>;
  }

  if (!tournament) notFound();
  
  if (!user) {
    return (
      <main className="container fade-in" style={{ paddingTop: 40, textAlign: 'center' }}>
        <h2>You must be logged in to register.</h2>
        <Link href="/login" className="btn btn-primary mt-4">Log in</Link>
      </main>
    );
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(x => x !== eventId) : [...prev, eventId]
    );
  };

  const handleRegister = async () => {
    if (selectedEvents.length === 0 || !user) return;
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('registrations')
        .upsert(
          {
            user_id: user.id,
            tournament_id: tournament.id,
            event_ids: selectedEvents,
            status: 'confirmed',
            checked_in: false,
          },
          { onConflict: 'user_id,tournament_id' }
        );
        
      if (error) throw error;
      router.push(`/tournament/${tournament.id}`);
    } catch (e: any) {
      alert(`Registration failed: ${e.message}`);
      setSubmitting(false);
    }
  };

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 640 }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-8">
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Discover</Link>
        <span>/</span>
        <Link href={`/tournament/${id}`} style={{ color: 'var(--text-secondary)' }}>{tournament.name}</Link>
        <span>/</span>
        <span>Register</span>
      </div>

      <div className="section-tag">Registration</div>
      <h1 className="text-title mb-2">{tournament.name}</h1>
      <p className="text-secondary text-sm mb-8">
        {new Date(tournament.starts_at).toLocaleDateString()} • {tournament.location || 'Online'}
      </p>

      <h2 className="text-headline mb-4">Select Events</h2>
      <p className="text-sm text-secondary mb-6">
        Choose one or more events to compete in. You can register for multiple events.
      </p>

      <div className="flex-col" style={{ gap: 10, marginBottom: 32 }}>
        {events.map(event => {
          const selected = selectedEvents.includes(event.id);
          return (
            <label key={event.id} className={`event-checkbox ${selected ? 'selected' : ''}`}>
              <input type="checkbox" checked={selected} onChange={() => toggleEvent(event.id)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 3 }}>{event.name}</div>
                <div className="text-sm text-secondary">
                  👥 {event.entrants_count || 0} entrants &nbsp;•&nbsp; {event.format.replace('_', ' ')}
                </div>
              </div>
              <div className="checkbox-mark">{selected ? '✓' : ''}</div>
            </label>
          );
        })}
      </div>

      {/* Summary */}
      {selectedEvents.length > 0 && (
        <div className="card" style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--accent-dim)', borderColor: 'var(--accent)' }}>
          <div className="text-sm text-accent" style={{ fontWeight: 600 }}>
            ✓ {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} selected
          </div>
        </div>
      )}

      <div className="flex" style={{ gap: 12 }}>
        <Link href={`/tournament/${id}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
          Cancel
        </Link>
        <button
          className="btn btn-primary btn-lg"
          style={{ flex: 2, justifyContent: 'center' }}
          disabled={selectedEvents.length === 0 || submitting}
          onClick={handleRegister}
        >
          {submitting ? 'Registering…' : 'Complete Registration →'}
        </button>
      </div>
    </main>
  );
}
