'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const GAMES = [
  'Super Fighter V', 'Smash Bros. Ultimate', 'Fighter Z',
  'Tekken 8', 'Valorant', 'CS2', 'League of Legends',
  'Rocket League', 'Dragon Ball FighterZ', 'Guilty Gear Strive',
  'Street Fighter 6', 'Mortal Kombat 1', 'Other'
];

export default function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { id } = use(params);

  // Tournament fields
  const [name, setName] = useState('');
  const [game, setGame] = useState(GAMES[0]);
  const [customGame, setCustomGame] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [fee, setFee] = useState('0');
  const [prizePool, setPrizePool] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);
  
  useEffect(() => {
    async function loadTournament() {
      const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).single();
      if (error) {
        setError('Failed to load tournament');
      } else if (data) {
        setName(data.name);
        if (GAMES.includes(data.game)) {
          setGame(data.game);
        } else {
          setGame('Other');
          setCustomGame(data.game);
        }
        setIsOnline(data.is_online);
        setLocation(data.location || '');
        setStartsAt(data.starts_at ? new Date(data.starts_at).toISOString().slice(0, 16) : '');
        setFee((data.registration_fee || 0).toString());
        setPrizePool(data.prize_pool || '');
        setBannerUrl(data.banner_url || '');
        setBannerPreview(data.banner_url || '');
        setThumbnailUrl(data.thumbnail_url || '');
        setThumbnailPreview(data.thumbnail_url || '');
        setVideoUrl(data.video_url || '');
        setDescription(data.description_md || '');
        
        // redirect if not organizer
        if (user && data.organizer_id !== user.id) {
          router.push(`/tournament/${id}`);
        }
      }
      setFetchLoading(false);
    }
    
    if (user && !authLoading) {
      loadTournament();
    }
  }, [id, user, authLoading, router]);

  if (authLoading || fetchLoading) {
    return <main className="fade-in container" style={{ padding: '40px 0', textAlign: 'center' }}>Loading...</main>;
  }

  if (!user) {
    return (
      <main className="fade-in container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <h2>You must be logged in to edit this tournament.</h2>
        <Link href="/login" className="btn btn-primary mt-4">Log in</Link>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const finalGame = game === 'Other' ? customGame : game;
    if (!name || !finalGame || !startsAt) {
      setError('Please fill in all required fields (Name, Game, Date).');
      setLoading(false);
      return;
    }

    try {
      const dateObj = new Date(startsAt);
      if (isNaN(dateObj.getTime())) {
        setError('Invalid start date/time format.');
        setLoading(false);
        return;
      }

      // 1. Upload banner if provided
      let uploadedBannerUrl = bannerUrl;
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const filename = `${user.id}/${Date.now()}_banner.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('tournament-banners')
          .upload(filename, bannerFile);
          
        if (uploadErr) {
          setError(`Failed to upload banner: ${uploadErr.message}`);
          setLoading(false);
          return;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('tournament-banners')
          .getPublicUrl(uploadData.path);
          
        uploadedBannerUrl = publicUrlData.publicUrl;
      }

      // 1b. Upload thumbnail if provided
      let uploadedThumbnailUrl = thumbnailUrl;
      if (thumbnailFile) {
        const ext = thumbnailFile.name.split('.').pop();
        const filename = `${user.id}/${Date.now()}_thumb.${ext}`;
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

      // 2. Update tournament
      const { error: tErr } = await supabase
        .from('tournaments')
        .update({
          name,
          game: finalGame,
          is_online: isOnline,
          location: isOnline ? null : location,
          starts_at: dateObj.toISOString(),
          registration_fee: parseFloat(fee) || 0,
          prize_pool: prizePool || null,
          banner_url: uploadedBannerUrl || null,
          thumbnail_url: uploadedThumbnailUrl || null,
          video_url: videoUrl || null,
          description_md: description || null,
        })
        .eq('id', id);

      if (tErr) {
        setError(tErr.message);
        setLoading(false);
        return;
      }

      router.push(`/tournament/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <main className="fade-in" style={{ backgroundColor: 'var(--background)', minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button className="btn btn-secondary" onClick={() => router.back()}>← Back</button>
          <h1 className="text-display">Edit Tournament</h1>
        </div>

        {error && (
          <div className="card mb-6" style={{ padding: 16, borderLeft: '4px solid var(--danger)', backgroundColor: 'var(--tint-bg)' }}>
            <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* TOURNAMENT DETAILS */}
          <div className="card mb-8">
            <h2 className="text-headline mb-4" style={{ padding: '0 24px', marginTop: 24 }}>Tournament Details</h2>
            
            <div className="divider" />
            
            <div style={{ padding: 24 }}>
              <div className="grid-2 mb-4">
                <div className="input-group">
                  <label className="input-label">Tournament Name *</label>
                  <input
                    type="text" className="input" required
                    placeholder="e.g. Neo City Clash"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Game *</label>
                  <select className="input" value={game} onChange={e => setGame(e.target.value)}>
                    {GAMES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {game === 'Other' && (
                <div className="input-group mb-4">
                  <label className="input-label">Custom Game Name *</label>
                  <input
                    type="text" className="input" required
                    placeholder="e.g. Street Fighter III: 3rd Strike"
                    value={customGame} onChange={e => setCustomGame(e.target.value)}
                  />
                </div>
              )}

              <div className="input-group mb-4">
                <label className="input-label">Event Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="isOnline"
                      checked={isOnline}
                      onChange={() => setIsOnline(true)}
                    />
                    <span>🌐 Online Tournament</span>
                  </label>
                  <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="isOnline"
                      checked={!isOnline}
                      onChange={() => setIsOnline(false)}
                    />
                    <span>📍 In-Person Event</span>
                  </label>
                </div>
              </div>

              {!isOnline && (
                <div className="input-group mb-4">
                  <label className="input-label">Venue Location *</label>
                  <input
                    type="text" className="input" required={!isOnline}
                    placeholder="e.g. 123 Arcade St, New York, NY"
                    value={location} onChange={e => setLocation(e.target.value)}
                  />
                </div>
              )}

              <div className="grid-2 mb-4">
                <div className="input-group">
                  <label className="input-label">Start Date & Time *</label>
                  <input
                    type="datetime-local" className="input" required
                    value={startsAt} onChange={e => setStartsAt(e.target.value)}
                  />
                </div>
                <div className="grid-2" style={{ gap: 16 }}>
                  <div className="input-group">
                    <label className="input-label">Entry Fee ($)</label>
                    <input
                      type="number" min="0" step="0.01" className="input"
                      placeholder="0.00"
                      value={fee} onChange={e => setFee(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Prize Pool</label>
                    <input
                      type="text" className="input"
                      placeholder="e.g. $5,000"
                      value={prizePool} onChange={e => setPrizePool(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="input-group mb-4">
                <label className="input-label">Thumbnail Image (Square - Upload or URL)</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setThumbnailFile(file);
                        setThumbnailPreview(URL.createObjectURL(file));
                        setThumbnailUrl('');
                      }
                    }}
                    style={{ display: 'block' }}
                  />
                  <span className="text-secondary">or</span>
                  <input
                    type="url" className="input"
                    placeholder="https://example.com/thumb.jpg"
                    value={thumbnailUrl} 
                    onChange={e => {
                      setThumbnailUrl(e.target.value);
                      setThumbnailFile(null);
                      setThumbnailPreview(e.target.value);
                    }}
                    style={{ flex: 1 }}
                  />
                </div>
                {thumbnailPreview && (
                  <img src={thumbnailPreview} alt="Thumbnail preview" style={{ marginTop: 12, width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                )}
              </div>

              <div className="input-group mb-4">
                <label className="input-label">Banner Image (Upload or URL)</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBannerFile(file);
                        setBannerPreview(URL.createObjectURL(file));
                        setBannerUrl('');
                      }
                    }}
                    style={{ display: 'block' }}
                  />
                  <span className="text-secondary">or</span>
                  <input
                    type="url" className="input"
                    placeholder="https://example.com/banner.jpg"
                    value={bannerUrl} 
                    onChange={e => {
                      setBannerUrl(e.target.value);
                      setBannerFile(null);
                      setBannerPreview(e.target.value);
                    }}
                    style={{ flex: 1 }}
                  />
                </div>
                {bannerPreview && (
                  <img src={bannerPreview} alt="Banner preview" style={{ marginTop: 12, width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }} />
                )}
              </div>

              <div className="input-group mb-4">
                <label className="input-label">Video URL (YouTube/Twitch)</label>
                <input
                  type="url" className="input"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description (Markdown Supported)</label>
                <textarea
                  className="input"
                  rows={6}
                  placeholder="Tell players about your tournament, rules, format, etc..."
                  value={description} onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex justify-end gap-4 mt-8">
            <Link href={`/tournament/${id}`} className="btn btn-secondary btn-lg">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
