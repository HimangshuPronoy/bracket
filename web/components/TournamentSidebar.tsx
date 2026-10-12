"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';

interface EventItem {
  id: string;
  name: string;
}

interface TournamentSidebarProps {
  tournamentId: string;
  organizerId: string;
  registrationFee: number;
  tickets?: { name: string; price: number }[];
  events: EventItem[];
}

export function TournamentSidebar({ tournamentId, organizerId, registrationFee, tickets = [], events }: TournamentSidebarProps) {
  const { user } = useAuth();
  const { t } = useI18n();
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
      <div className="card card-p24 text-center">
        <p className="text-sm text-secondary">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="card card-p24">
      {isOrganizer ? (
        <div>
          <h3 className="text-headline mb-2">{t('tournament.manageTournament')}</h3>
          <p className="text-sm text-secondary mb-4">Manage this tournament and its settings.</p>
          <Link
            href={`/tournament/${tournamentId}/edit`}
            className="btn btn-primary btn-block mb-3"
          >
            {t('tournament.editTournament')}
          </Link>
          {events.length > 0 && (
            <>
              <div className="divider mt-3 mb-3" />
              <p className="text-sm text-secondary mb-3">Bracket Management:</p>
              <div className="flex-col gap-2">
                {events.map((e: EventItem) => (
                  <Link
                    key={e.id}
                    href={`/tournament/${tournamentId}/event/${e.id}/manage`}
                    className="btn btn-secondary btn-sm btn-block"
                  >
                    ⚙ {e.name}
                  </Link>
                ))}
              </div>
            </>
          )}
          <div className="mt-3">
            <Link
              href={`/organizer`}
              className="btn btn-ghost btn-sm btn-block"
            >
              Organizer Dashboard
            </Link>
          </div>
        </div>
      ) : isRegistered ? (
        <div>
          <div className="text-center mb-6">
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <h3 className="text-headline text-success">{t('tournament.registered')}</h3>
            <p className="text-sm text-secondary mt-2">
              {t('tournament.registeredDesc')}
            </p>
          </div>
          <div className="divider" />
          <div className="flex-col gap-2 mb-4">
            {events
              .filter(e => registration?.event_ids?.includes(e.id))
              .map(e => (
                <Link
                  key={e.id}
                  href={`/tournament/${tournamentId}/event/${e.id}/bracket`}
                  className="btn btn-secondary btn-block"
                >
                  {e.name} {t('tournament.viewBracket')}
                </Link>
              ))}
          </div>

          <Link
            href={`/tournament/${tournamentId}/register`}
            className="btn btn-secondary btn-block mb-2"
          >
            ✏️ Change Events
          </Link>

          <button
            onClick={async () => {
              if (!registration) return;
              if (!window.confirm(t('myEvents.confirmWithdraw'))) return;
              const { error } = await supabase
                .from('registrations')
                .update({ status: 'cancelled', event_ids: [] })
                .eq('id', registration.id);
              if (error) {
                alert(`Failed to withdraw: ${error.message}`);
              } else {
                setRegistration(null);
              }
            }}
            className="btn btn-ghost btn-sm btn-block text-danger"
            style={{ color: 'var(--danger)' }}
          >
            {t('tournament.withdraw')}
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-headline mb-2">{t('tournament.registerNow')}</h3>
          {tickets.length > 0 ? (
            <div className="flex-col gap-2 mb-4 mt-3">
              <p className="text-sm text-secondary mb-2">Available Tickets:</p>
              {tickets.map((tItem, i) => (
                <div key={i} className="ticket-item">
                  <span className="text-sm font-semibold">{tItem.name}</span>
                  <span className="badge badge-accent ticket-price-badge">
                    ${tItem.price}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            registrationFee > 0 && (
              <div className="card mb-4 mt-3" style={{ padding: 12, background: 'var(--tint-bg)', border: 'none' }}>
                <p className="text-sm">
                  Registration requires a <strong>${registrationFee} USD</strong> entry fee per event.
                </p>
              </div>
            )
          )}
          {!user ? (
            <div>
              <p className="text-sm text-secondary mb-4">You must be signed in to register.</p>
              <Link href="/login" className="btn btn-primary btn-block">
                {t('nav.logIn')}
              </Link>
            </div>
          ) : (
            <Link
              href={`/tournament/${tournamentId}/register`}
              className="btn btn-primary btn-block"
            >
              {registrationFee === 0 ? `${t('tournament.registerNow')} — ${t('tournament.free')}` : `${t('tournament.registerNow')} — $${registrationFee}`}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
