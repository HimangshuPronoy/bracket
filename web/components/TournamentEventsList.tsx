"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

interface EventItem {
  id: string;
  name: string;
  entrantsCount: number;
  format: string;
}

interface TournamentEventsListProps {
  tournamentId: string;
  events: EventItem[];
}

export function TournamentEventsList({ tournamentId, events }: TournamentEventsListProps) {
  const { user } = useAuth();
  const [registration, setRegistration] = useState<{ id: string; event_ids: string[]; status: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('registrations')
      .select('id, event_ids, status')
      .eq('user_id', user.id)
      .eq('tournament_id', tournamentId)
      .maybeSingle()
      .then(({ data }) => {
        setRegistration(data);
      });
  }, [user, tournamentId]);

  const isRegistered = registration?.status === 'confirmed';

  return (
    <div>
      <h2 className="text-display mb-4" style={{ fontSize: 28 }}>Events</h2>
      {events.length === 0 ? (
        <p className="text-secondary">No events have been created for this tournament yet.</p>
      ) : (
        <div className="flex-col" style={{ gap: 12 }}>
          {events.map((event) => {
            const registered = isRegistered && registration?.event_ids?.includes(event.id);
            return (
              <div key={event.id} className={`card ${registered ? 'card-accent' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-headline">{event.name}</span>
                    {registered && <span className="badge badge-success">✓ Registered</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-secondary">
                    <span>👥 {event.entrantsCount} entrants</span>
                    <span>•</span>
                    <span>{event.format}</span>
                  </div>
                </div>
                {registered && (
                  <Link
                    href={`/tournament/${tournamentId}/event/${event.id}/bracket`}
                    className="btn btn-secondary btn-sm"
                  >
                    View Bracket →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
