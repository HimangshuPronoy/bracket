'use client';

import { useState } from 'react';
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

const FORMATS = [
  { value: 'double_elim', label: 'Double Elimination' },
  { value: 'single_elim', label: 'Single Elimination' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'swiss', label: 'Swiss' },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60)
    + '-' + Math.random().toString(36).slice(2, 7);
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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

  // Events (sub-entries under tournament)
  const [events, setEvents] = useState([{ name: '', format: 'double_elim', maxEntrants: '' }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addEvent = () => setEvents(e => [...e, { name: '', format: 'double_elim', maxEntrants: '' }]);
  const removeEvent = (i: number) => setEvents(e => e.filter((_, idx) => idx !== i));
  const updateEvent = (i: number, field: string, val: string) => {
    setEvents(e => e.map((ev, idx) => idx === i ? { ...ev, [field]: val } : ev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError('You must be logged in.'); return; }
    if (!name || !startsAt) { setError('Tournament name and start date are required.'); return; }
    if (!isOnline && !location) { setError('Location is required for in-person events.'); return; }

    setLoading(true);
    setError('');

    const finalGame = game === 'Other' ? customGame : game;
    const dateObj = new Date(startsAt);
    if (isNaN(dateObj.getTime())) {
      setError('Invalid start date/time.');
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

    // 2. Create tournament
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .insert({
        organizer_id: user.id,
        name,
        slug: slugify(name),
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
        tags: isOnline ? ['Online'] : ['In-Person'],
        status: 'registration_open',
      })
      .select()
      .single();

    if (tErr || !tournament) {
      setError(tErr?.message ?? 'Failed to create tournament.');
      setLoading(false);
      return;
    }

    // 2. Create events (if any are named)
    const namedEvents = events.filter(ev => ev.name.trim());
    if (namedEvents.length > 0) {
      const { error: evErr } = await supabase.from('events').insert(
        namedEvents.map(ev => ({
          tournament_id: tournament.id,
          name: ev.name,
          format: ev.format,
          max_entrants: ev.maxEntrants ? parseInt(ev.maxEntrants) : null,
        }))
      );
      if (evErr) {
        setError(`Tournament created but events failed: ${evErr.message}`);
        setLoading(false);
        return;
      }
    }

    // Redirect to the tournament page
    router.push(`/tournament/${tournament.id}`);
  };

  if (authLoading) {
    return (
      <main className="container fade-in" style={{ paddingTop: 80, textAlign: 'center' }}>
        <p className="text-secondary">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container fade-in" style={{ paddingTop: 80, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 className="text-display" style={{ fontSize: 28, marginBottom: 12 }}>Sign in to create events</h1>
        <p className="text-secondary mb-6">You need an account to organize tournaments.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <Link href="/login" className="btn btn-primary btn-lg">Log In</Link>
          <Link href="/signup" className="btn btn-secondary btn-lg">Sign Up</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div className="page-hero" style={{ paddingBottom: 24 }}>
        <div className="section-tag">Organizer Tools</div>
        <h1 className="text-display">Create Tournament</h1>
        <p className="text-body text-secondary mt-3">
          Set up your tournament, configure brackets, and start accepting registrations.
        </p>
      </div>

      {error && (
        <div style={{ padding: 14, backgroundColor: 'rgba(255,69,58,0.1)', color: '#FF453A', borderRadius: 10, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      <form className="flex-col gap-6" onSubmit={handleSubmit}>

        {/* ── Tournament Info ── */}
        <div className="card" style={{ padding: 32 }}>
          <h2 className="text-title mb-6" style={{ fontSize: 20 }}>Tournament Info</h2>
          <div className="flex-col gap-4">

            <div className="input-group">
              <label className="input-label">Tournament Name *</label>
              <input
                type="text" className="input"
                placeholder="e.g. Neo City Clash 2026"
                value={name} onChange={e => setName(e.target.value)} required
              />
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Game *</label>
                <select
                  className="input"
                  value={game}
                  onChange={e => setGame(e.target.value)}
                  style={{ appearance: 'none' }}
                >
                  {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              {game === 'Other' && (
                <div className="input-group">
                  <label className="input-label">Custom Game Name *</label>
                  <input
                    type="text" className="input"
                    placeholder="e.g. Skullgirls"
                    value={customGame} onChange={e => setCustomGame(e.target.value)} required
                  />
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Start Date & Time *</label>
                <input
                  type="datetime-local" className="input"
                  value={startsAt} onChange={e => setStartsAt(e.target.value)} required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Location Type</label>
                <select
                  className="input"
                  value={isOnline ? 'online' : 'in-person'}
                  onChange={e => setIsOnline(e.target.value === 'online')}
                  style={{ appearance: 'none' }}
                >
                  <option value="online">🌐 Online</option>
                  <option value="in-person">📍 In-Person (Venue)</option>
                </select>
              </div>
              {!isOnline && (
                <div className="input-group">
                  <label className="input-label">Venue / City *</label>
                  <input
                    type="text" className="input"
                    placeholder="e.g. Arcade Bar, New York"
                    value={location} onChange={e => setLocation(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Entry Fee (USD)</label>
                <input
                  type="number" className="input"
                  placeholder="0" min="0" step="0.01"
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

            <div className="input-group">
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

            <div className="input-group">
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

            <div className="input-group">
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
                style={{ height: 140, paddingTop: 12, resize: 'vertical' }}
                placeholder={'# Welcome!\nRules and details go here...'}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Events ── */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 className="text-title" style={{ fontSize: 20 }}>Events</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addEvent}>
              + Add Event
            </button>
          </div>
          <div className="flex-col gap-4">
            {events.map((ev, i) => (
              <div key={i} className="card" style={{ padding: 20, background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className="text-sm text-secondary" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Event {i + 1}
                  </span>
                  {events.length > 1 && (
                    <button type="button" onClick={() => removeEvent(i)} style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer', fontSize: 18 }}>
                      ✕
                    </button>
                  )}
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Event Name</label>
                    <input
                      type="text" className="input"
                      placeholder="e.g. Singles, Doubles..."
                      value={ev.name} onChange={e => updateEvent(i, 'name', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Format</label>
                    <select
                      className="input"
                      value={ev.format}
                      onChange={e => updateEvent(i, 'format', e.target.value)}
                      style={{ appearance: 'none' }}
                    >
                      {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Max Entrants</label>
                    <input
                      type="number" className="input"
                      placeholder="Unlimited"
                      value={ev.maxEntrants} onChange={e => updateEvent(i, 'maxEntrants', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Link href="/organizer" className="btn btn-ghost">Cancel</Link>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ minWidth: 180, justifyContent: 'center' }}
          >
            {loading ? 'Publishing...' : '🚀 Publish Tournament'}
          </button>
        </div>

      </form>
    </main>
  );
}
