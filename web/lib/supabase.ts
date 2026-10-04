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

// Maps raw Supabase tournament → format expected by the UI
export function mapTournament(t: SupabaseTournament) {
  return {
    id: t.id,
    name: t.name,
    game: t.game,
    date: new Date(t.starts_at).toLocaleDateString(),
    location: t.location || 'TBA',
    isOnline: t.is_online,
    registrationFee: t.registration_fee,
    prizePool: t.prize_pool,
    imageUrl: t.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2940&auto=format&fit=crop',
    thumbnailUrl: t.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2940&auto=format&fit=crop',
    videoUrl: t.video_url,
    organizerName: '',
    descriptionMarkdown: t.description_md,
    registrationOpen: t.status === 'registration_open' || t.status === 'published' || t.status === 'draft',
    tags: t.tags || [],
  };
}

export type MappedTournament = ReturnType<typeof mapTournament>;
