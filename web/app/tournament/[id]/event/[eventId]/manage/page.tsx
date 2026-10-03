'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { generateSingleElim, generateDoubleElim, generateRoundRobin } from '@/lib/bracket';
import type { Entrant, StageState } from '@/lib/bracket';

interface Props {
  params: Promise<{ id: string; eventId: string }>;
}

interface Registrant {
  userId: string;
  name: string;
  seed: number;
  checkedIn: boolean;
}

export default function ManageBracketPage({ params }: Props) {
  const { id, eventId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [tournament, setTournament] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [bracketGenerated, setBracketGenerated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: tData } = await supabase.from('tournaments').select('*').eq('id', id).single();
      const { data: eData } = await supabase.from('events').select('*').eq('id', eventId).single();

      if (!tData || !eData) { setLoading(false); return; }
      setTournament(tData);
      setEvent(eData);
      setBracketGenerated(!!eData.stage_data);

      // Fetch confirmed registrations for this event
      const { data: regs } = await supabase
        .from('registrations')
        .select('user_id, event_ids, checked_in, profiles(display_name, handle)')
        .eq('tournament_id', id)
        .eq('status', 'confirmed')
        .order('registered_at', { ascending: true });

      const eventRegs = (regs || []).filter((r: any) => r.event_ids.includes(eventId));
      setRegistrants(eventRegs.map((r: any, idx: number) => ({
        userId: r.user_id,
        name: r.profiles?.display_name || r.profiles?.handle || r.user_id.slice(0, 8),
        seed: idx + 1,
        checkedIn: r.checked_in ?? false,
      })));
      setLoading(false);
    }
    load();
  }, [id, eventId]);

  const moveSeed = (index: number, direction: -1 | 1) => {
    const newList = [...registrants];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newList.length) return;
    [newList[index], newList[targetIdx]] = [newList[targetIdx], newList[index]];
    // Reassign seeds
    setRegistrants(newList.map((r, i) => ({ ...r, seed: i + 1 })));
  };

  const handleCheckIn = async (userId: string) => {
    setCheckingIn(userId);
    const reg = await supabase
      .from('registrations')
      .update({ checked_in: true })
      .eq('user_id', userId)
      .eq('tournament_id', id);

    setRegistrants(prev =>
      prev.map(r => r.userId === userId ? { ...r, checkedIn: true } : r)
    );
    setCheckingIn(null);
  };

  const handleGenerateBracket = async () => {
    if (!event) return;
    setSaving(true);
    setError('');

    try {
      const entrants: Entrant[] = registrants.map((r, i) => ({ id: r.name, seed: i + 1 }));

      let stage: StageState;
      if (event.format === 'double_elim') {
        stage = generateDoubleElim(entrants);
      } else if (event.format === 'round_robin') {
        stage = generateRoundRobin(entrants);
      } else {
        stage = generateSingleElim(entrants);
      }

      const { error: saveErr } = await supabase
        .from('events')
        .update({ stage_data: stage as any, status: 'in_progress' })
        .eq('id', eventId);

      if (saveErr) throw saveErr;
      setBracketGenerated(true);
      router.push(`/tournament/${id}/event/${eventId}/bracket`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate bracket');
      setSaving(false);
    }
  };

  const handleResetBracket = async () => {
    if (!confirm('This will erase the current bracket. Are you sure?')) return;
    setSaving(true);
    await supabase.from('events').update({ stage_data: null, status: 'pending' }).eq('id', eventId);
    setBracketGenerated(false);
    setSaving(false);
  };

  if (loading) {
    return <main className="container fade-in" style={{ paddingTop: 60, textAlign: 'center' }}><p className="text-secondary">Loading...</p></main>;
  }

  if (!tournament || user?.id !== tournament.organizer_id) {
    return (
      <main className="container fade-in" style={{ paddingTop: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 className="text-display" style={{ fontSize: 24 }}>Access Denied</h1>
        <p className="text-secondary mt-2">Only the tournament organizer can manage brackets.</p>
        <Link href={`/tournament/${id}`} className="btn btn-secondary mt-4">Back to Tournament</Link>
      </main>
    );
  }

  const formatLabel: Record<string, string> = {
    single_elim: 'Single Elimination',
    double_elim: 'Double Elimination',
    round_robin: 'Round Robin',
    swiss: 'Swiss',
  };

  const checkedInCount = registrants.filter(r => r.checkedIn).length;

  return (
    <main className="container fade-in" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 800 }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-secondary mb-6">
        <Link href={`/tournament/${id}`} style={{ color: 'var(--text-secondary)' }}>{tournament.name}</Link>
        <span>/</span>
        <span>{event?.name}</span>
        <span>/</span>
        <span>Manage Bracket</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="section-tag mb-2">Organizer Tools</div>
          <h1 className="text-display" style={{ fontSize: 32 }}>{event?.name} — Bracket Setup</h1>
          <p className="text-secondary text-sm mt-2">
            Format: <strong>{formatLabel[event?.format] ?? event?.format}</strong> &nbsp;•&nbsp;
            {registrants.length} registered &nbsp;•&nbsp;
            {checkedInCount}/{registrants.length} checked in
          </p>
        </div>
        {bracketGenerated && (
          <Link href={`/tournament/${id}/event/${eventId}/bracket`} className="btn btn-primary btn-lg">
            View Bracket →
          </Link>
        )}
      </div>

      {error && (
        <div style={{ padding: 12, backgroundColor: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Entrant List / Seeding */}
      <div className="card mb-6" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="text-headline">Entrants & Seeding</h2>
          <span className="text-sm text-secondary">Drag to reorder seeds</span>
        </div>
        {registrants.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
            <p className="text-secondary">No registrations yet for this event.</p>
          </div>
        ) : (
          <div>
            {registrants.map((r, i) => (
              <div
                key={r.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 24px',
                  borderBottom: i < registrants.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: 16,
                  background: r.checkedIn ? 'rgba(0,212,170,0.04)' : undefined,
                }}
              >
                {/* Seed Badge */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: i === 0 ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>
                  {r.seed}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  {r.checkedIn && <div className="text-xs" style={{ color: 'var(--success)', marginTop: 2 }}>✓ Checked in</div>}
                </div>

                {/* Check-in button */}
                {!r.checkedIn && (
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={checkingIn === r.userId}
                    onClick={() => handleCheckIn(r.userId)}
                    style={{ minWidth: 100 }}
                  >
                    {checkingIn === r.userId ? '...' : 'Check In'}
                  </button>
                )}

                {/* Reorder buttons */}
                <div className="flex gap-1">
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={i === 0}
                    onClick={() => moveSeed(i, -1)}
                    style={{ padding: '4px 8px', minWidth: 'unset' }}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={i === registrants.length - 1}
                    onClick={() => moveSeed(i, 1)}
                    style={{ padding: '4px 8px', minWidth: 'unset' }}
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 items-center flex-wrap">
        {!bracketGenerated ? (
          <button
            className="btn btn-primary btn-lg"
            disabled={saving || registrants.length < 2}
            onClick={handleGenerateBracket}
          >
            {saving ? 'Generating...' : `🚀 Generate ${formatLabel[event?.format] ?? ''} Bracket`}
          </button>
        ) : (
          <>
            <Link href={`/tournament/${id}/event/${eventId}/bracket`} className="btn btn-primary btn-lg">
              View Bracket →
            </Link>
            <button
              className="btn btn-danger"
              disabled={saving}
              onClick={handleResetBracket}
            >
              ↩ Reset Bracket
            </button>
          </>
        )}
        <Link href={`/tournament/${id}`} className="btn btn-ghost">
          Back to Tournament
        </Link>
      </div>

      {registrants.length < 2 && (
        <p className="text-sm text-secondary mt-4">
          ⚠ At least 2 entrants are required to generate a bracket.
        </p>
      )}
    </main>
  );
}
