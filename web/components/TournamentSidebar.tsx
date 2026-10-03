"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

interface EventItem {
  id: string;
  name: string;
}

interface TournamentSidebarProps {
  tournamentId: string;
  organizerId: string;
  registrationFee: number;
  events: EventItem[];
}

export function TournamentSidebar({ tournamentId, organizerId, registrationFee, events }: TournamentSidebarProps) {
  const { user } = useAuth();
  const [registration, setRegistration] = useState<{ id: string; event_ids: string[]; status: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from('registrations')
      .select('id, event_ids, status')
      .eq('user_id', user.id)
      .eq('tournament_id', tournamentId)
      .maybeSingle()
      .then(({ data }) => {
        setRegistration(data);
        setLoading(false);
      });
  }, [user, tournamentId]);

  const isRegistered = registration?.status === 'confirmed';
  const isOrganizer = !!user && user.id === organizerId;

  if (loading) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <p className="text-sm text-secondary">Loading…</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      {isOrganizer ? (
        <div>
          <h3 className="text-headline mb-2">Organizer Dashboard</h3>
          <p className="text-sm text-secondary mb-4">Manage this tournament and its settings.</p>
          <Link
            href={`/tournament/${tournamentId}/edit`}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
          >
            Edit Tournament
          </Link>
          {events.length > 0 && (
            <>
              <div className="divider" style={{ margin: '12px 0' }} />
              <p className="text-sm text-secondary mb-3">Bracket Management:</p>
              <div className="flex-col" style={{ gap: 8 }}>
                {events.map((e: EventItem) => (
                  <Link
                    key={e.id}
                    href={`/tournament/${tournamentId}/event/${e.id}/manage`}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    ⚙ {e.name}
                  </Link>
                ))}
              </div>
            </>
          )}
          <div style={{ marginTop: 12 }}>
            <Link
              href={`/organizer`}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Organizer Dashboard
            </Link>
          </div>
        </div>
      ) : isRegistered ? (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <h3 className="text-headline text-success">You're Registered!</h3>
            <p className="text-sm text-secondary mt-2">
              You're in {registration?.event_ids?.length || 0} event{registration?.event_ids?.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="divider" />
          <p className="text-sm text-secondary mb-4">View live brackets for your events:</p>
          <div className="flex-col" style={{ gap: 8 }}>
            {events
              .filter(e => registration?.event_ids?.includes(e.id))
              .map(e => (
                <Link
                  key={e.id}
                  href={`/tournament/${tournamentId}/event/${e.id}/bracket`}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {e.name} Bracket →
                </Link>
              ))}
          </div>
          <button
            onClick={async () => {
              if (!registration) return;
              await supabase
                .from('registrations')
                .update({ status: 'cancelled' })
                .eq('id', registration.id);
              setRegistration(null);
            }}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'center', marginTop: 16, color: 'var(--danger)', opacity: 0.8 }}
          >
            Cancel Registration
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-headline mb-2">Register Now</h3>
          {registrationFee > 0 && (
            <div className="card mb-4" style={{ padding: 12, background: 'var(--tint-bg)', border: 'none' }}>
              <p className="text-sm">
                Registration requires a <strong>${registrationFee} USD</strong> entry fee per event.
              </p>
            </div>
          )}
          {!user ? (
            <div>
              <p className="text-sm text-secondary mb-4">You must be signed in to register.</p>
              <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Log In to Register
              </Link>
            </div>
          ) : (
            <Link
              href={`/tournament/${tournamentId}/register`}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {registrationFee === 0 ? 'Register — Free' : `Register — $${registrationFee}`}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
