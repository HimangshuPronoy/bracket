'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, getEmbedVideoUrl } from '@/lib/supabase';
import { deleteTournament, deleteEvent } from '@/lib/api/tournament';
import { useAuth } from '@/lib/AuthContext';

const GAMES = [
  'Fortnite', 'Overwatch 2', 'Valorant', 'CS2',
  'Super Smash Bros. Ultimate', 'Rocket League', 'League of Legends',
  'Apex Legends', 'Street Fighter 6', 'Super Fighter V',
  'Mortal Kombat 1', 'Other'
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

  const [status, setStatus] = useState('registration_open');
  const [locations, setLocations] = useState<string[]>(['']);
  const [tickets, setTickets] = useState<{ name: string; price: string }[]>([]);
  const [existingEvents, setExistingEvents] = useState<any[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventFormat, setNewEventFormat] = useState('double_elim');
  const [newEventMax, setNewEventMax] = useState('');

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
        if (Array.isArray(data.locations) && data.locations.length > 0) {
          setLocations(data.locations);
        } else if (data.location) {
          setLocations([data.location]);
        }
        if (Array.isArray(data.tickets) && data.tickets.length > 0) {
          setTickets(data.tickets.map((t: any) => ({ name: t.name, price: String(t.price ?? '0') })));
        }
        setStatus(data.status || 'registration_open');
        setStartsAt(data.starts_at ? new Date(data.starts_at).toISOString().slice(0, 16) : '');
        setFee((data.registration_fee || 0).toString());
        setPrizePool(data.prize_pool || '');
        setBannerUrl(data.banner_url || '');
        setBannerPreview(data.banner_url || '');
        setThumbnailUrl(data.thumbnail_url || '');
        setThumbnailPreview(data.thumbnail_url || '');
        setVideoUrl(data.video_url || '');
        setDescription(data.description_md || '');

        const { data: evData } = await supabase.from('events').select('*').eq('tournament_id', id);
        setExistingEvents(evData || []);
        
        // redirect if not organizer
        if (user && data.organizer_id !== user.id) {
          router.push(`/tournament/${id}`);
        }
      }
      setFetchLoading(false);
    }
    
    if (user && !authLoading) {
      loadTournament();
    } else if (!authLoading && !user) {
      setFetchLoading(false);
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
      const cleanLocations = isOnline ? [] : locations.filter(l => l.trim());
      const cleanTickets = tickets.filter(t => t.name.trim()).map(t => ({ name: t.name, price: parseFloat(t.price) || 0 }));
      const primaryFee = cleanTickets.length > 0 ? cleanTickets[0].price : (parseFloat(fee) || 0);

      const { error: tErr } = await supabase
        .from('tournaments')
        .update({
          name,
          game: finalGame,
          is_online: isOnline,
          location: isOnline ? null : (cleanLocations[0] || location || null),
          locations: cleanLocations,
          starts_at: dateObj.toISOString(),
          registration_fee: primaryFee,
          tickets: cleanTickets,
          prize_pool: prizePool || null,
          banner_url: uploadedBannerUrl || null,
          thumbnail_url: uploadedThumbnailUrl || null,
          video_url: getEmbedVideoUrl(videoUrl) || (videoUrl ? videoUrl.trim() : null),
          description_md: description || null,
          status,
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

  const handleAddNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    try {
      const { data: newEv, error: evErr } = await supabase
        .from('events')
        .insert({
          tournament_id: id,
          name: newEventName.trim(),
          format: newEventFormat,
          max_entrants: newEventMax ? parseInt(newEventMax) : null,
        })
        .select()
        .single();
      if (evErr) throw evErr;
      if (newEv) {
        setExistingEvents(prev => [...prev, newEv]);
        setNewEventName('');
        setNewEventMax('');
        setShowAddEvent(false);
      }
    } catch (err: any) {
      alert(`Failed to add event: ${err.message}`);
    }
  };

  const handleDeleteExistingEvent = async (evId: string, evName: string) => {
    if (!window.confirm(`Are you sure you want to delete event "${evName}"? This will permanently remove the event, its bracket, and entrants.`)) return;
    try {
      await deleteEvent(evId);
      setExistingEvents(prev => prev.filter(e => e.id !== evId));
    } catch (err: any) {
      alert(`Failed to delete event: ${err.message}`);
    }
  };

  const handleDeleteTournament = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This action CANNOT be undone and will delete all events, matches, and registrations.`)) return;
    try {
      await deleteTournament(id);
      router.push('/organizer');
    } catch (err: any) {
      alert(`Failed to delete tournament: ${err.message}`);
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
                  <label className="input-label">Tournament Status *</label>
                  <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="registration_open">🟢 Registration Open</option>
                    <option value="registration_closed">🔴 Registration Closed</option>
                    <option value="in_progress">⚔️ In Progress</option>
                    <option value="completed">🏆 Completed</option>
                    <option value="draft">📝 Draft</option>
                    <option value="cancelled">✖ Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="input-group mb-4">
                <label className="input-label">Game *</label>
                <select className="input" value={game} onChange={e => setGame(e.target.value)}>
                  {GAMES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="input-label mb-0">Venue Locations *</label>
                    <button type="button" onClick={() => setLocations([...locations, ''])} className="text-sm text-accent bg-transparent border-0 cursor-pointer">
                      + Add Location
                    </button>
                  </div>
                  {locations.map((loc, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text" className="input"
                        placeholder="e.g. 123 Arcade St, New York, NY"
                        value={loc} onChange={e => {
                          const newLocs = [...locations];
                          newLocs[i] = e.target.value;
                          setLocations(newLocs);
                        }}
                        required={i === 0 && !isOnline}
                      />
                      {locations.length > 1 && (
                        <button type="button" onClick={() => setLocations(locations.filter((_, idx) => idx !== i))} className="btn btn-ghost px-3 text-danger">✕</button>
                      )}
                    </div>
                  ))}
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
                <div className="input-group">
                  <label className="input-label">Prize Pool</label>
                  <input
                    type="text" className="input"
                    placeholder="e.g. $5,000"
                    value={prizePool} onChange={e => setPrizePool(e.target.value)}
                  />
                </div>
              </div>

              {/* Ticket Tiers */}
              <div className="input-group mb-4 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="input-label mb-0">Ticket Tiers / Pricing</label>
                  <button type="button" onClick={() => setTickets([...tickets, { name: '', price: '0' }])} className="text-sm text-accent bg-transparent border-0 cursor-pointer">
                    + Add Ticket Tier
                  </button>
                </div>
                {tickets.length === 0 ? (
                  <div className="input-group">
                    <label className="input-label">Default Entry Fee ($)</label>
                    <input
                      type="number" min="0" step="0.01" className="input"
                      placeholder="0.00"
                      value={fee} onChange={e => setFee(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex-col gap-2">
                    {tickets.map((ticket, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text" className="input" style={{ flex: 2 }}
                          placeholder="e.g. General Admission"
                          value={ticket.name} onChange={e => {
                            const newT = [...tickets];
                            newT[i].name = e.target.value;
                            setTickets(newT);
                          }}
                          required
                        />
                        <div className="relative" style={{ flex: 1 }}>
                          <span style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }}>$</span>
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
                        <button type="button" onClick={() => setTickets(tickets.filter((_, idx) => idx !== i))} className="btn btn-ghost px-3 text-danger">✕</button>
                      </div>
                    ))}
                  </div>
                )}
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
                <label className="input-label">Video URL (YouTube/Twitch/Vimeo)</label>
                <input
                  type="url" className="input"
                  placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                />
                <span className="text-secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Paste any YouTube link (watch, youtu.be, shorts, live), Twitch stream, or Vimeo URL.
                </span>
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

          {/* EVENTS & BRACKETS */}
          <div className="card mb-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 16px' }}>
              <div>
                <h2 className="text-headline">Events & Brackets</h2>
                <p className="text-sm text-secondary">Manage existing events or add new games/brackets to this tournament.</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddEvent(!showAddEvent)}
              >
                {showAddEvent ? 'Cancel' : '+ Add Event'}
              </button>
            </div>

            <div className="divider" />

            <div style={{ padding: 24 }}>
              {showAddEvent && (
                <div className="card mb-6" style={{ padding: 20, border: '1px solid var(--accent)', background: 'var(--tint-bg)' }}>
                  <h3 className="text-subhead font-bold mb-3">Add New Sub-Event</h3>
                  <div className="flex-col gap-3">
                    <div className="input-group">
                      <label className="input-label">Event Name</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Melee Singles, Street Fighter 6 1v1"
                        value={newEventName}
                        onChange={e => setNewEventName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="input-group">
                        <label className="input-label">Format</label>
                        <select
                          className="input"
                          value={newEventFormat}
                          onChange={e => setNewEventFormat(e.target.value)}
                        >
                          <option value="double_elim">Double Elimination</option>
                          <option value="single_elim">Single Elimination</option>
                          <option value="round_robin">Round Robin</option>
                          <option value="swiss">Swiss</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Max Entrants (Optional)</label>
                        <input
                          type="number"
                          min="2"
                          className="input"
                          placeholder="Unlimited"
                          value={newEventMax}
                          onChange={e => setNewEventMax(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowAddEvent(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleAddNewEvent}
                        disabled={!newEventName.trim()}
                      >
                        Create Event
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {existingEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
                  <p>No sub-events created yet.</p>
                </div>
              ) : (
                <div className="flex-col gap-3">
                  {existingEvents.map((ev: any) => (
                    <div
                      key={ev.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'var(--surface-sunken)',
                        borderRadius: 8,
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div>
                        <div className="font-semibold text-headline">{ev.name}</div>
                        <div className="text-xs text-secondary">
                          {ev.format === 'double_elim' ? 'Double Elimination' : ev.format === 'single_elim' ? 'Single Elimination' : ev.format === 'round_robin' ? 'Round Robin' : ev.format === 'swiss' ? 'Swiss' : ev.format} • {ev.entrants_count ?? ev.entrant_count ?? 0} entrants {ev.max_entrants ? `/ ${ev.max_entrants} max` : ''}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/tournament/${id}/event/${ev.id}/manage`}
                          className="btn btn-secondary btn-sm"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/tournament/${id}/event/${ev.id}/bracket`}
                          className="btn btn-ghost btn-sm"
                        >
                          Bracket →
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingEvent(ev.id, ev.name)}
                          className="btn btn-ghost btn-sm text-danger"
                          style={{ color: 'var(--danger)' }}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

        {/* DANGER ZONE */}
        <div className="card mt-12" style={{ border: '1px solid var(--danger)', background: 'rgba(255, 69, 58, 0.04)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 className="text-headline" style={{ color: 'var(--danger)', marginBottom: 4 }}>Danger Zone: Delete Tournament</h3>
              <p className="text-sm text-secondary">Permanently delete this tournament, its brackets, and all attendee registrations.</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteTournament}
              className="btn btn-danger"
            >
              Delete Tournament
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
