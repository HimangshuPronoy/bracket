import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseTournament = {
  id: string;
  name: string;
  game: string;
  starts_at: string;
  location: string | null;
  is_online: boolean;
  registration_fee: number;
  prize_pool: string | null;
  banner_url: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  status: string;
  organizer_id: string;
  description_md: string | null;
  tags: string[];
};

export function getGameBanner(game?: string, customBanner?: string | null): string {
  if (customBanner && customBanner.trim().length > 0) return customBanner;
  const g = (game || '').toLowerCase();
  if (g.includes('melee') || g.includes('smash') || g.includes('bros')) {
    return '/images/tournaments/weekly_online_smash.jpg';
  }
  if (g.includes('fighter') || g.includes('sf') || g.includes('street')) {
    return '/images/tournaments/local_legends.jpg';
  }
  if (g.includes('tekken') || g.includes('mortal') || g.includes('guilty')) {
    return '/images/tournaments/pro_circuit.jpg';
  }
  return '/images/tournaments/neo_city_clash.jpg';
}

export function getEmbedVideoUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  let url = rawUrl.trim();
  if (!url) return null;

  // Extract from iframe tag if user pasted full embed snippet
  const iframeMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) {
    url = iframeMatch[1].trim();
  }

  // Preserve time/start if present
  const timeMatch = url.match(/[?&](?:t|start)=(\d+)s?/);
  const timeParam = timeMatch ? `?start=${timeMatch[1]}` : '';

  // 1. YouTube: youtu.be/<id>
  const youtuBeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch) {
    return `https://www.youtube-nocookie.com/embed/${youtuBeMatch[1]}${timeParam}`;
  }

  // YouTube: watch, embed, shorts, live, v
  const ytMatch = url.match(/(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)?youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/|v\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}${timeParam}`;
  }

  // 2. Twitch
  const currentHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'bracket-lac.vercel.app';
  const parents = `&parent=localhost&parent=bracket-lac.vercel.app${currentHost !== 'bracket-lac.vercel.app' && currentHost !== 'localhost' ? `&parent=${encodeURIComponent(currentHost)}` : ''}`;

  const twitchClip = url.match(/(?:clips\.twitch\.tv\/|(?:www\.)?twitch\.tv\/[a-zA-Z0-9_]+\/clip\/)([a-zA-Z0-9_-]+)/);
  if (twitchClip) {
    return `https://clips.twitch.tv/embed?clip=${twitchClip[1]}${parents}&autoplay=false`;
  }

  const twitchVid = url.match(/(?:www\.)?twitch\.tv\/videos\/(\d+)/);
  if (twitchVid) {
    return `https://player.twitch.tv/?video=${twitchVid[1]}${parents}&autoplay=false`;
  }

  const twitchChannel = url.match(/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchChannel && !['directory', 'videos', 'p', 'downloads', 'jobs'].includes(twitchChannel[1].toLowerCase())) {
    return `https://player.twitch.tv/?channel=${twitchChannel[1]}${parents}&autoplay=false`;
  }

  // 3. Vimeo
  const vimeoMatch = url.match(/(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
}

// Maps raw Supabase tournament → format expected by the UI
export function mapTournament(t: SupabaseTournament) {
  const banner = getGameBanner(t.game, t.banner_url);
  const thumb = t.thumbnail_url || banner;
  return {
    id: t.id,
    name: t.name,
    game: t.game,
    date: new Date(t.starts_at).toLocaleDateString(),
    location: t.location || 'TBA',
    isOnline: t.is_online,
    registrationFee: t.registration_fee,
    prizePool: t.prize_pool,
    imageUrl: banner,
    thumbnailUrl: thumb,
    videoUrl: getEmbedVideoUrl(t.video_url) ?? t.video_url,
    organizerName: '',
    descriptionMarkdown: t.description_md,
    status: t.status,
    registrationOpen: t.status === 'registration_open',
    tags: t.tags || [],
  };
}

export type MappedTournament = ReturnType<typeof mapTournament>;

