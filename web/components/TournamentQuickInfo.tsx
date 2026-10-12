'use client';

import { useI18n } from '@/lib/i18n';

interface Props {
  date: string;
  isOnline: boolean;
  locations: string[];
  location: string;
  prizePool?: string | null;
  registrationFee: number;
  tickets: any[];
}

export function TournamentQuickInfo({
  date,
  isOnline,
  locations,
  location,
  prizePool,
  registrationFee,
  tickets,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="grid-2 mb-8 gap-3">
      <div className="card card-p16">
        <div className="text-sm text-secondary mb-1">{t('tournament.dates')}</div>
        <div className="text-headline">{date}</div>
      </div>
      <div className="card card-p16">
        <div className="text-sm text-secondary mb-1">{t('tournament.location')}</div>
        <div className="text-headline">
          {isOnline
            ? location
            : locations.length > 0
            ? locations.join(' • ')
            : location}
        </div>
      </div>
      {prizePool && (
        <div className="card card-p16">
          <div className="text-sm text-secondary mb-1">{t('tournament.prizes')}</div>
          <div className="text-headline" style={{ color: 'var(--warning)' }}>
            {prizePool}
          </div>
        </div>
      )}
      <div className="card card-p16">
        <div className="text-sm text-secondary mb-1">{t('tournament.entryFee')}</div>
        <div className="text-headline">
          {tickets.length > 0 ? (
            `From $${registrationFee} USD`
          ) : registrationFee === 0 ? (
            <span className="text-success">{t('tournament.free')}</span>
          ) : (
            `$${registrationFee} USD`
          )}
        </div>
      </div>
    </div>
  );
}
