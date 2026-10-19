import { supabase, getEmbedVideoUrl } from '@/lib/supabase';

export interface TicketData { name: string; price: string; }
export interface EventData { name: string; format: string; maxEntrants: string; }

export interface CreateTournamentParams {
  userId: string;
  name: string;
  game: string;
  isOnline: boolean;
  locations: string[];
  startsAt: string;
  tickets: TicketData[];
  prizePool: string;
  bannerFile: File | null;
  bannerUrl: string;
  thumbnailFile: File | null;
  thumbnailUrl: string;
  videoUrl: string;
  description: string;
  events: EventData[];
}

function slugify(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
  const base = clean || 'tournament';
  return base + '-' + Math.random().toString(36).slice(2, 7);
}

export async function createTournament(params: CreateTournamentParams) {
  const { userId, name, game, isOnline, locations, startsAt, tickets, prizePool, bannerFile, bannerUrl, thumbnailFile, thumbnailUrl, videoUrl, description, events } = params;

  const dateObj = new Date(startsAt);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid start date/time.');
  }

  let uploadedBannerUrl = bannerUrl;
  if (bannerFile) {
    const ext = bannerFile.name.split('.').pop();
    const filename = `${userId}/${Date.now()}_banner.${ext}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('tournament-banners')
      .upload(filename, bannerFile);
      
    if (uploadErr) throw new Error(`Failed to upload banner: ${uploadErr.message}`);
    
    const { data: publicUrlData } = supabase.storage
      .from('tournament-banners')
      .getPublicUrl(uploadData.path);
      
    uploadedBannerUrl = publicUrlData.publicUrl;
  }

  let uploadedThumbnailUrl = thumbnailUrl;
  if (thumbnailFile) {
    const ext = thumbnailFile.name.split('.').pop();
    const filename = `${userId}/${Date.now()}_thumb.${ext}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('tournament-banners')
      .upload(filename, thumbnailFile);
      
    if (!uploadErr && uploadData) {
      const { data: publicUrlData } = supabase.storage
        .from('tournament-banners')
        .getPublicUrl(uploadData.path);
      uploadedThumbnailUrl = publicUrlData.publicUrl;
    }
  }

  const { data: tournament, error: tErr } = await supabase
    .from('tournaments')
    .insert({
      organizer_id: userId,
      name,
      slug: slugify(name),
      game,
      is_online: isOnline,
      location: isOnline ? null : locations[0] || null,
      locations: isOnline ? [] : locations.filter(l => l.trim()),
      starts_at: dateObj.toISOString(),
      registration_fee: tickets.length > 0 ? (parseFloat(tickets[0].price) || 0) : 0,
      tickets: tickets.filter(t => t.name.trim()).map(t => ({ name: t.name, price: parseFloat(t.price) || 0 })),
      prize_pool: prizePool || null,
      banner_url: uploadedBannerUrl || null,
      thumbnail_url: uploadedThumbnailUrl || null,
      video_url: getEmbedVideoUrl(videoUrl) || (videoUrl ? videoUrl.trim() : null),
      description_md: description || null,
      tags: isOnline ? ['Online'] : ['In-Person'],
      status: 'registration_open',
    })
    .select()
    .single();

  if (tErr || !tournament) {
    throw new Error(tErr?.message ?? 'Failed to create tournament.');
  }

  const namedEvents = events.filter(ev => ev.name.trim());
  if (namedEvents.length === 0) {
    throw new Error('Please add at least one event (e.g. Singles Bracket).');
  }

  const { error: evErr } = await supabase.from('events').insert(
    namedEvents.map(ev => ({
      tournament_id: tournament.id,
      name: ev.name,
      format: ev.format,
      max_entrants: ev.maxEntrants ? parseInt(ev.maxEntrants) : null,
    }))
  );
  if (evErr) {
    throw new Error(`Tournament created but events failed: ${evErr.message}`);
  }

  return tournament;
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  // 1. Delete all attendee registrations first to avoid foreign-key update conflicts during event cascade
  const { error: regErr } = await supabase.from('registrations').delete().eq('tournament_id', tournamentId);
  if (regErr) {
    console.warn('Error deleting registrations before tournament delete:', regErr.message);
  }

  // 2. Delete rankings and matches
  await supabase.from('rankings').delete().eq('tournament_id', tournamentId);
  await supabase.from('matches').delete().eq('tournament_id', tournamentId);

  // 3. Delete events
  await supabase.from('events').delete().eq('tournament_id', tournamentId);

  // 4. Finally delete the tournament record
  const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  // 1. Delete rankings and matches referencing this event
  await supabase.from('rankings').delete().eq('event_id', eventId);
  await supabase.from('matches').delete().eq('event_id', eventId);

  // 2. Delete the event record (database trigger will clean up registrations)
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) {
    throw new Error(error.message);
  }
}
