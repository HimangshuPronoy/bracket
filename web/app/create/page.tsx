'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { createTournament } from '@/lib/api/tournament';

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

export default function CreateEventPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Tournament fields
  const [name, setName] = useState('');
  const [game, setGame] = useState(GAMES[0]);
  const [customGame, setCustomGame] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [locations, setLocations] = useState<string[]>(['']);
  const [startsAt, setStartsAt] = useState('');
  const [tickets, setTickets] = useState<{name: string, price: string}[]>([{name: 'General Admission', price: '0'}]);
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
    if (!isOnline && (!locations || locations.length === 0 || !locations[0].trim())) { 
      setError('Location is required for in-person events.'); 
      return; 
    }

    setLoading(true);
    setError('');

    try {
      const finalGame = game === 'Other' ? customGame : game;
      const tournament = await createTournament({
        userId: user.id,
        name,
        game: finalGame,
        isOnline,
        locations,
        startsAt,
        tickets,
        prizePool,
        bannerFile,
        bannerUrl,
        thumbnailFile,
        thumbnailUrl,
        videoUrl,
        description,
        events: events.map(ev => ({ ...ev, maxEntrants: ev.maxEntrants || '' }))
      });

      router.push(`/tournament/${tournament.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create tournament.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="container fade-in pt-8 pb-20 text-center">
        <p className="text-secondary">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container fade-in pt-8 pb-20 max-w-md mx-auto text-center">
        <div style={{ fontSize: 48 }} className="mb-4">🔒</div>
        <h1 className="text-display mb-3" style={{ fontSize: 28 }}>Sign in to create events</h1>
        <p className="text-secondary mb-6">You need an account to organize tournaments.</p>
        <div className="flex justify-center gap-3 mt-6">
          <Link href="/login" className="btn btn-primary btn-lg">Log In</Link>
          <Link href="/signup" className="btn btn-secondary btn-lg">Sign Up</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container fade-in pt-8 pb-20 max-w-lg mx-auto">
      <div className="page-hero mb-6">
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
        <div className="card card-p32">
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
                  className="input select-input"
                  value={game}
                  onChange={e => setGame(e.target.value)}
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

            <div className="input-group">
              <label className="input-label">Location Type</label>
              <select
                className="input select-input"
                value={isOnline ? 'online' : 'in-person'}
                onChange={e => setIsOnline(e.target.value === 'online')}
              >
                <option value="online">🌐 Online</option>
                <option value="in-person">📍 In-Person (Venue/Tour)</option>
              </select>
            </div>
            {!isOnline && (
              <div className="input-group">
                <div className="flex items-center justify-between">
                  <label className="input-label">Locations / Venues *</label>
                  <button type="button" onClick={() => setLocations([...locations, ''])} className="text-sm text-accent bg-transparent border-0 cursor-pointer">
                    + Add Location
                  </button>
                </div>
                {locations.map((loc, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text" className="input"
                      placeholder="e.g. Arcade Bar, New York"
                      value={loc} onChange={e => {
                        const newLocs = [...locations];
                        newLocs[i] = e.target.value;
                        setLocations(newLocs);
                      }}
                      required={i === 0}
                    />
                    {locations.length > 1 && (
                      <button type="button" onClick={() => setLocations(locations.filter((_, idx) => idx !== i))} className="btn btn-ghost px-3 text-danger">✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="input-group border-t pt-8 mt-2">
              <div className="flex justify-between items-center mb-3">
                <label className="input-label mb-0">Ticket Tiers</label>
                <button type="button" onClick={() => setTickets([...tickets, { name: '', price: '0' }])} className="text-sm text-accent bg-transparent border-0 cursor-pointer">
                  + Add Ticket Tier
                </button>
              </div>
              
              <div className="flex-col gap-3">
                {tickets.map((ticket, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <input
                      type="text" className="input" style={{ flex: 2 }}
                      placeholder="e.g. Day 1 Pass"
                      value={ticket.name} onChange={e => {
                        const newT = [...tickets];
                        newT[i].name = e.target.value;
                        setTickets(newT);
                      }}
                      required
                    />
                    <div className="relative flex-1">
                      <span style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }}>$</span>
                      <input
                        type="number" className="input" style={{ paddingLeft: 24 }}
                        placeholder="0" min="0" step="0.01"
                        value={ticket.price} onChange={e => {
                          const newT = [...tickets];
                          newT[i].price = e.target.value;
                          setTickets(newT);
                        }}
                        required
                      />
                    </div>
                    {tickets.length > 1 && (
                      <button type="button" onClick={() => setTickets(tickets.filter((_, idx) => idx !== i))} className="btn btn-ghost px-3 text-danger">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Prize Pool</label>
              <input
                type="text" className="input"
                placeholder="e.g. $5,000"
                value={prizePool} onChange={e => setPrizePool(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Thumbnail Image (Square - Upload or URL)</label>
              <div className="flex gap-3 items-center">
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
                <img src={thumbnailPreview} alt="Thumbnail preview" className="img-thumb-preview mt-3" />
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Banner Image (Upload or URL)</label>
              <div className="flex gap-3 items-center">
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
                <img src={bannerPreview} alt="Banner preview" className="img-banner-preview mt-3" />
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
        <div className="card card-p32">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-title" style={{ fontSize: 20 }}>Events</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addEvent}>
              + Add Event
            </button>
          </div>
          <div className="flex-col gap-4">
            {events.map((ev, i) => (
              <div key={i} className="card card-p24 bg-elevated">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-secondary" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Event {i + 1}
                  </span>
                  {events.length > 1 && (
                    <button type="button" onClick={() => removeEvent(i)} className="text-danger" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
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
                      className="input select-input"
                      value={ev.format}
                      onChange={e => updateEvent(i, 'format', e.target.value)}
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
        <div className="flex justify-end gap-3">
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
