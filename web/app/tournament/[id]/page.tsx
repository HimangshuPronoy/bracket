import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { TournamentSidebar } from '@/components/TournamentSidebar';
import { TournamentEventsList } from '@/components/TournamentEventsList';
import { ClientTournamentLoader } from '@/components/ClientTournamentLoader';

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: t } = await supabase.from('tournaments').select('name').eq('id', id).single();
  return { title: t ? `${t.name} — Bracket` : 'Tournament — Bracket' };
}

export default async function TournamentPage({ params }: Props) {
  const { id } = await params;
  
  const { data: rawTournament } = await supabase.from('tournaments').select('*').eq('id', id).single();
  
  if (!rawTournament) {
    return <ClientTournamentLoader id={id} />;
  }

  // Fetch organizer display name
  const { data: organizer } = await supabase
    .from('profiles')
    .select('display_name, handle')
    .eq('id', rawTournament.organizer_id)
    .maybeSingle();

  const tournament = {
    id: rawTournament.id,
    name: rawTournament.name,
    game: rawTournament.game,
    date: new Date(rawTournament.starts_at).toLocaleDateString(),
    location: rawTournament.location || 'TBA',
    locations: rawTournament.locations || [],
    isOnline: rawTournament.is_online,
    registrationFee: rawTournament.registration_fee,
    tickets: rawTournament.tickets || [],
    prizePool: rawTournament.prize_pool,
    imageUrl: rawTournament.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2940&auto=format&fit=crop',
    thumbnailUrl: rawTournament.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2940&auto=format&fit=crop',
    organizerName: organizer?.display_name ?? organizer?.handle ?? 'Unknown Organizer',
    descriptionMarkdown: rawTournament.description_md,
    videoUrl: rawTournament.video_url ?? null,
    registrationOpen: rawTournament.status === 'registration_open' || rawTournament.status === 'published' || rawTournament.status === 'draft',
  };

  const { data: rawEvents } = await supabase.from('events').select('*').eq('tournament_id', id);
  const events = (rawEvents || []).map((e) => ({
    id: e.id,
    name: e.name,
    entrantsCount: e.entrants_count ?? 0,
    format: e.format === 'single_elim' ? 'Single Elimination'
           : e.format === 'double_elim' ? 'Double Elimination'
           : e.format === 'round_robin' ? 'Round Robin'
           : e.format === 'swiss' ? 'Swiss'
           : e.format,
  }));

  const gameEmoji: Record<string, string> = {
    'Super Fighter V': '🥊',
    'Bros. Ultimate': '⚔️',
    'Fighter Z': '🌀',
  };

  return (
    <main className="fade-in">
      {/* Hero Header */}
      <div className="hero-banner">
        <img 
          src={tournament.imageUrl} 
          alt={tournament.name} 
          className="hero-banner-img"
        />
        <div className="hero-banner-overlay" />
        <div className="container hero-banner-content">
          <div className="header-flex">
            {tournament.thumbnailUrl && !tournament.thumbnailUrl.includes('images.unsplash.com') && (
              <img 
                src={tournament.thumbnailUrl} 
                alt="Thumbnail"
                className="hero-thumbnail"
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-neutral">
                  {gameEmoji[tournament.game] ?? '🎮'} {tournament.game}
                </span>
                {tournament.isOnline ? (
                  <span className="badge badge-accent">🌐 Online</span>
                ) : (
                  <span className="badge badge-tour">
                    📍 {tournament.locations.length > 1 ? 'Multi-City Tour' : 'In-Person'}
                  </span>
                )}
              </div>
              <h1 className="text-display text-display-lg">{tournament.name}</h1>
              <p className="text-body text-secondary">by {tournament.organizerName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container pt-8 pb-20">
        <div className="layout-sidebar">
          
          {/* Left Column */}
          <div>
            {/* Quick Info Grid */}
            <div className="grid-2 mb-8 gap-3">
              <div className="card card-p16">
                <div className="text-sm text-secondary mb-1">Date</div>
                <div className="text-headline">{tournament.date}</div>
              </div>
              <div className="card card-p16">
                <div className="text-sm text-secondary mb-1">{tournament.isOnline ? 'Location' : (tournament.locations.length > 1 ? 'Locations' : 'Venue')}</div>
                <div className="text-headline">
                  {tournament.isOnline ? tournament.location : (
                    tournament.locations.length > 0 
                      ? tournament.locations.join(' • ') 
                      : tournament.location
                  )}
                </div>
              </div>
              {tournament.prizePool && (
                <div className="card card-p16">
                  <div className="text-sm text-secondary mb-1">Prize Pool</div>
                  <div className="text-headline" style={{ color: 'var(--warning)' }}>{tournament.prizePool}</div>
                </div>
              )}
              <div className="card card-p16">
                <div className="text-sm text-secondary mb-1">Entry Fee</div>
                <div className="text-headline">
                  {tournament.tickets.length > 0 ? (
                    `From $${tournament.registrationFee} USD`
                  ) : (
                    tournament.registrationFee === 0 ? <span className="text-success">Free</span> : `$${tournament.registrationFee} USD`
                  )}
                </div>
              </div>
            </div>

            {/* Markdown Description */}
            {tournament.descriptionMarkdown && (
              <div className="card mb-8 markdown-body card-p32">
                <ReactMarkdown>{tournament.descriptionMarkdown}</ReactMarkdown>
              </div>
            )}

            {/* Video Embed */}
            {tournament.videoUrl && (
              <div className="card mb-8 card-p0">
                <iframe 
                  width="100%" 
                  height="400" 
                  src={tournament.videoUrl} 
                  title="Tournament Video"
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              </div>
            )}

            {/* Events */}
            <TournamentEventsList tournamentId={tournament.id} events={events} />
          </div>

          {/* Right sidebar */}
          <div className="sticky-sidebar">
            <TournamentSidebar 
              tournamentId={tournament.id}
              organizerId={rawTournament.organizer_id}
              registrationFee={tournament.registrationFee}
              tickets={tournament.tickets}
              events={events}
            />
          </div>

        </div>
      </div>
    </main>
  );
}
