import type { Metadata } from 'next';
import { supabase, getGameBanner } from '@/lib/supabase';
import DiscoverView from '@/components/DiscoverView';

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

  // Fetch real registration counts
  const registrationCounts: Record<string, number> = {};
  if (rawTournaments && rawTournaments.length > 0) {
    const tournamentIds = rawTournaments.map(t => t.id);
    const { data: regData } = await supabase
      .from('registrations')
      .select('tournament_id')
      .in('tournament_id', tournamentIds)
      .eq('status', 'confirmed');
    if (regData) {
      regData.forEach((r: any) => {
        registrationCounts[r.tournament_id] = (registrationCounts[r.tournament_id] || 0) + 1;
      });
    }
  }

  const mappedTournaments = (rawTournaments || []).map((t: any) => {
    const org = profiles.find(p => p.id === t.organizer_id);
    const banner = getGameBanner(t.game, t.banner_url);
    return {
      id: t.id,
      name: t.name,
      game: t.game,
      date: new Date(t.starts_at).toLocaleDateString(),
      location: t.location || 'TBA',
      isOnline: t.is_online,
      registrationFee: t.registration_fee,
      prizePool: t.prize_pool,
      entrantsCount: registrationCounts[t.id] ?? 0,
      imageUrl: banner,
      thumbnailUrl: t.thumbnail_url || banner,
      organizerName: org?.display_name || org?.handle || 'Unknown Organizer',
      registrationOpen: t.status === 'registration_open',
    };
  });

  return <DiscoverView mappedTournaments={mappedTournaments} />;
}
