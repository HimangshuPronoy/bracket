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
  const [isExistingRegistration, setIsExistingRegistration] = useState(false);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);

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

      if (user) {
        const { data: regData } = await supabase
          .from('registrations')
          .select('*')
          .eq('tournament_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (regData) {
          setIsExistingRegistration(true);
          if (Array.isArray(regData.event_ids)) {
            setSelectedEvents(regData.event_ids);
          }
        }
      }

      setLoading(false);
    }
    load();
  }, [id, user]);

  if (loading || authLoading) {
    return <main className="container fade-in" style={{ paddingTop: 40, textAlign: 'center' }}>Loading...</main>;
  }

  if (!tournament) notFound();
  
  if (!user) {
    return (
      <main className="container fade-in" style={{ paddingTop: 40, textAlign: 'center' }}>
        <h2>You must be logged in to register.</h2>
        <Link href={`/login?returnUrl=/tournament/${id}/register`} className="btn btn-primary mt-4">Log in</Link>
      </main>
    );
  }

  const isRegistrationOpen = tournament.status === 'registration_open';

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(x => x !== eventId) : [...prev, eventId]
    );
  };

  const handleWithdraw = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to withdraw from this tournament? Your registration for all events will be cancelled.')) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'cancelled', event_ids: [] })
        .eq('user_id', user.id)
        .eq('tournament_id', id);
      if (error) throw error;
      router.push(`/tournament/${id}`);
    } catch (e: any) {
      alert(`Failed to withdraw: ${e.message}`);
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!isRegistrationOpen) {
      alert('Registration is currently closed for this tournament.');
      return;
    }
    if (!user) return;
    if (selectedEvents.length === 0) {
      if (isExistingRegistration) {
        handleWithdraw();
        return;
      }
      return;
    }
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

  const tickets = Array.isArray(tournament.tickets) && tournament.tickets.length > 0 ? tournament.tickets : null;
  const currentPrice = tickets 
    ? (tickets[selectedTicketIndex]?.price ?? tournament.registration_fee ?? 0)
    : (tournament.registration_fee ?? 0);

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
      <p className="text-secondary text-sm mb-6">
        {new Date(tournament.starts_at).toLocaleDateString()} • {tournament.location || 'Online'}
      </p>

      {!isRegistrationOpen && (
        <div className="card mb-6" style={{ padding: 16, borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--tint-bg)' }}>
          <div className="font-semibold text-warning mb-1">Registration is Closed</div>
          <p className="text-sm text-secondary">
            This tournament has status &quot;{tournament.status.replace('_', ' ')}&quot;. New registrations or changes cannot be submitted.
          </p>
        </div>
      )}

      {isExistingRegistration && isRegistrationOpen && (
        <div className="card mb-6" style={{ padding: 14, borderLeft: '4px solid var(--accent)', backgroundColor: 'var(--tint-bg)' }}>
          <p className="text-sm">
            <strong>You are already registered.</strong> You can update your selected events below.
          </p>
        </div>
      )}

      {/* Ticket Tier Selection */}
      {tickets && tickets.length > 0 && (
        <div className="card mb-6" style={{ padding: 20 }}>
          <h2 className="text-headline mb-2">Ticket Option</h2>
          <p className="text-sm text-secondary mb-4">Select your registration pass type.</p>
          <div className="flex-col gap-2">
            {tickets.map((t: any, idx: number) => (
              <label 
                key={idx}
                className={`event-checkbox ${selectedTicketIndex === idx ? 'selected' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="ticket_tier"
                  checked={selectedTicketIndex === idx}
                  onChange={() => setSelectedTicketIndex(idx)}
                />
                <div style={{ flex: 1 }}>
                  <div className="font-semibold">{t.name}</div>
                </div>
                <div className="font-mono font-bold">
                  {t.price > 0 ? `$${t.price}` : 'Free'}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-headline mb-2">Select Events</h2>
      <p className="text-sm text-secondary mb-6">
        Choose one or more events to compete in. You can register for multiple events.
      </p>

      {events.length === 0 ? (
        <div className="card mb-8" style={{ padding: 32, textAlign: 'center' }}>
          <div className="text-2xl mb-2">🎮</div>
          <div className="font-semibold mb-1">No Events Configured Yet</div>
          <p className="text-sm text-secondary mb-4">
            The organizer has not added any sub-events to this tournament yet.
          </p>
          <Link href={`/tournament/${id}`} className="btn btn-secondary btn-sm">
            ← Return to Tournament
          </Link>
        </div>
      ) : (
        <div className="flex-col" style={{ gap: 10, marginBottom: 32 }}>
          {events.map(event => {
            const selected = selectedEvents.includes(event.id);
            return (
              <label key={event.id} className={`event-checkbox ${selected ? 'selected' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={selected} 
                  disabled={!isRegistrationOpen}
                  onChange={() => toggleEvent(event.id)} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 3 }}>{event.name}</div>
                  <div className="text-sm text-secondary">
                    👥 {event.entrant_count ?? event.entrants_count ?? 0} entrants &nbsp;•&nbsp; {event.format.replace('_', ' ')}
                  </div>
                </div>
                <div className="checkbox-mark">{selected ? '✓' : ''}</div>
              </label>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {selectedEvents.length > 0 && (
        <div className="card" style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--accent-dim)', borderColor: 'var(--accent)' }}>
          <div className="flex justify-between items-center">
            <span className="text-sm text-accent" style={{ fontWeight: 600 }}>
              ✓ {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-sm font-semibold">
              Total: {currentPrice > 0 ? `$${currentPrice}` : 'Free'}
            </span>
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
          disabled={!isRegistrationOpen || selectedEvents.length === 0 || submitting}
          onClick={handleRegister}
        >
          {submitting
            ? 'Saving…'
            : isExistingRegistration
              ? (selectedEvents.length === 0 ? 'Withdraw from Tournament' : 'Update Registration')
              : 'Complete Registration →'}
        </button>
      </div>

      {isExistingRegistration && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            className="btn btn-ghost text-danger"
            style={{ color: 'var(--danger)' }}
            disabled={submitting}
            onClick={handleWithdraw}
          >
            Withdraw from Tournament
          </button>
        </div>
      )}
    </main>
  );
}
