import type { Metadata } from 'next';
import Link from 'next/link';
import Carousel from '@/components/Carousel';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Discover Tournaments — Bracket',
  description: 'Browse and register for upcoming esports tournaments.',
};

export default async function DiscoverPage() {
  const { data: rawTournaments } = await supabase
    .from('tournaments')
    .select(`
      *,
      organizer:profiles ( display_name, handle )
    `)
    .order('starts_at', { ascending: true })
    .limit(20);

  const mappedTournaments = (rawTournaments || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    game: t.game,
    date: new Date(t.starts_at).toLocaleDateString(),
    location: t.location || 'TBA',
    isOnline: t.is_online,
    registrationFee: t.registration_fee,
    prizePool: t.prize_pool,
    entrantsCount: 0,
    imageUrl: t.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2940&auto=format&fit=crop',
    organizerName: t.organizer?.display_name || t.organizer?.handle || 'Unknown Organizer',
  }));

  const trending = mappedTournaments.slice(0, 6);
  const fightingGames = mappedTournaments.filter((t: any) => t.game.includes('Fighter') || t.game.includes('Bros') || t.game.includes('Smash') || t.game.includes('Tekken')).slice(0, 6);
  const shooters = mappedTournaments.filter((t: any) => t.game.includes('Valorant') || t.game.includes('Strike') || t.game.includes('Shooter') || t.game.includes('Halo') || t.game.includes('CS2')).slice(0, 6);

  // The featured tournament for the hero
  const featured = mappedTournaments[0] || trending[0];

  return (
    <main className="container fade-in">
      
      {/* Featured Hero */}
      {featured && (
        <Link href={`/tournament/${featured.id}`} style={{ display: 'block', textDecoration: 'none', marginBottom: 48 }}>
          <div style={{ position: 'relative', width: '100%', height: 360, borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <img 
              src={featured.imageUrl} 
              alt={featured.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 32, left: 32, right: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-accent mb-2">Featured Event</span>
                <h1 className="text-display" style={{ fontSize: 40, marginBottom: 8, color: '#fff' }}>{featured.name}</h1>
                <p className="text-body" style={{ color: 'rgba(255,255,255,0.7)' }}>{featured.game} • {featured.location}</p>
              </div>
              <button className="btn btn-primary">
                Register Now →
              </button>
            </div>
          </div>
        </Link>
      )}

      <div className="flex-col gap-8">
        <Carousel title="🔥 Trending Right Now" tournaments={trending} />
        <Carousel title="🥊 Fighting Games" tournaments={fightingGames} />
        <Carousel title="🔫 Tactical Shooters" tournaments={shooters} />
      </div>
    </main>
  );
}
