import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { supabase, getGameBanner } from '@/lib/supabase';
import { TournamentSidebar } from '@/components/TournamentSidebar';
import { TournamentEventsList } from '@/components/TournamentEventsList';
import { ClientTournamentLoader } from '@/components/ClientTournamentLoader';
import { TournamentQuickInfo } from '@/components/TournamentQuickInfo';

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
    imageUrl: getGameBanner(rawTournament.game, rawTournament.banner_url),
    thumbnailUrl: rawTournament.thumbnail_url || getGameBanner(rawTournament.game, rawTournament.banner_url),
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
    'Smash Bros. Ultimate': '⚔️',
    'Bros. Ultimate': '⚔️',
    'Fighter Z': '🌀',
    'Tekken 8': '🥊',
    'Valorant': '🔫',
    'CS2': '🔫',
    'League of Legends': '🧙',
    'Rocket League': '🚗',
    'Dragon Ball FighterZ': '🌀',
    'Guilty Gear Strive': '⚔️',
    'Street Fighter 6': '🥊',
    'Mortal Kombat 1': '💀',
  };

  return (
    <main className="fade-in">
      {/* Hero Header */}
      <div className="hero-banner" style={{ background: tournament.imageUrl ? undefined : '#0F172A' }}>
        {tournament.imageUrl && (
          <>
            <img 
              src={tournament.imageUrl} 
              alt={tournament.name} 
              className="hero-banner-img"
            />
            <div className="hero-banner-overlay" />
          </>
        )}
        <div className="container hero-banner-content">
          <div className="header-flex">
            {tournament.thumbnailUrl && (
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
            <TournamentQuickInfo
              date={tournament.date}
              isOnline={tournament.isOnline}
              locations={tournament.locations}
              location={tournament.location}
              prizePool={tournament.prizePool}
              registrationFee={tournament.registrationFee}
              tickets={tournament.tickets}
            />

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
                  src={tournament.videoUrl} 
                  title="Tournament Video"
                  style={{ width: '100%', aspectRatio: '16/9', height: 'auto', display: 'block', border: 'none' }}
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
