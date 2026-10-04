import type { Metadata } from 'next';
import Link from 'next/link';
import Carousel from '@/components/Carousel';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Discover Tournaments — Bracket',
  description: 'Browse and register for upcoming esports tournaments.',
};

export const revalidate = 0;

export default async function DiscoverPage() {
  const { data: rawTournaments, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('starts_at', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error fetching tournaments:', error);
  }

  let profiles: any[] = [];
  if (rawTournaments && rawTournaments.length > 0) {
    const organizerIds = Array.from(new Set(rawTournaments.map(t => t.organizer_id)));
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, display_name, handle')
      .in('id', organizerIds);
    if (profileData) profiles = profileData;
  }

  const mappedTournaments = (rawTournaments || []).map((t: any) => {
    const org = profiles.find(p => p.id === t.organizer_id);
    return {
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
      organizerName: org?.display_name || org?.handle || 'Unknown Organizer',
    };
  });

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
        {mappedTournaments.length === 0 ? (
          <div className="card empty-state" style={{ padding: 64, textAlign: 'center', marginTop: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
            <h2 className="text-display" style={{ fontSize: 24, marginBottom: 8 }}>No Public Tournaments Found</h2>
            <p className="text-body text-secondary" style={{ maxWidth: 400, margin: '0 auto' }}>
              There are no published tournaments right now. If you've created one on mobile, it might still be in "Draft" status!
            </p>
          </div>
        ) : (
          <>
            {trending.length > 0 && <Carousel title="🔥 Trending Right Now" tournaments={trending} />}
            {fightingGames.length > 0 && <Carousel title="🥊 Fighting Games" tournaments={fightingGames} />}
            {shooters.length > 0 && <Carousel title="🔫 Tactical Shooters" tournaments={shooters} />}
            
            {/* Catch-all for other games if they don't fit the above filters */}
            {mappedTournaments.length > 0 && trending.length === 0 && fightingGames.length === 0 && shooters.length === 0 && (
              <Carousel title="🎮 All Tournaments" tournaments={mappedTournaments} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
