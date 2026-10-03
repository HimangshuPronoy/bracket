'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { generateSingleElim, generateDoubleElim, generateRoundRobin, reportResult, undoResult, computeStandings } from '@/lib/bracket';
import type { StageState, Match } from '@/lib/bracket';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

interface Props {
  params: Promise<{ id: string; eventId: string }>;
}

type BracketTab = 'winners' | 'losers' | 'grand_final' | 'standings';

export default function BracketPage({ params }: Props) {
  const { id, eventId } = use(params);
  const { user } = useAuth();

  const [tournament, setTournament] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [stage, setStage] = useState<StageState | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<BracketTab>('winners');

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: tData } = await supabase.from('tournaments').select('*').eq('id', id).single();
      const { data: eData } = await supabase.from('events').select('*').eq('id', eventId).single();

      if (!mounted) return;
      setTournament(tData);
      setEvent(eData);

      if (eData?.stage_data) {
        setStage(eData.stage_data as unknown as StageState);
      } else {
        // No bracket yet — seed from confirmed registrations
        const { data: regs } = await supabase
          .from('registrations')
          .select('user_id, event_ids, profiles(display_name, handle)')
          .eq('tournament_id', id)
          .eq('status', 'confirmed');

        const eventRegs = (regs || []).filter((r: any) => r.event_ids.includes(eventId));

        const entrants = eventRegs.map((r: any, idx: number) => ({
          id: (r.profiles as any)?.display_name || (r.profiles as any)?.handle || r.user_id,
          seed: idx + 1,
        }));

        const seedList = entrants.length > 0
          ? entrants.slice(0, eData?.max_entrants ?? 64)
          : Array.from({ length: 8 }, (_, i) => ({ id: `Player ${i + 1}`, seed: i + 1 }));

        let generated: StageState;
        if (eData?.format === 'double_elim') {
          generated = generateDoubleElim(seedList);
        } else if (eData?.format === 'round_robin') {
          generated = generateRoundRobin(seedList);
        } else {
          generated = generateSingleElim(seedList);
        }

        setStage(generated);
      }
      setLoading(false);
    }
    load();

    // Real-time: pick up bracket changes from organizer or other devices
    const channel = supabase
      .channel(`event-bracket:${eventId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`,
      }, (payload) => {
        if (mounted && (payload.new as any).stage_data) {
          setStage((payload.new as any).stage_data as unknown as StageState);
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [id, eventId]);

  const saveStage = async (newStage: StageState) => {
    setIsSaving(true);
    await supabase
      .from('events')
      .update({ stage_data: newStage as any, status: newStage.status })
      .eq('id', eventId);
    setIsSaving(false);
  };

  const handleMatchClick = (match: Match) => {
    if (match.status === 'pending') return;
    setSelectedMatch(match);
  };

  const handleReport = async (scoreA: number, scoreB: number) => {
    if (!selectedMatch || !stage) return;
    const res = reportResult(stage, selectedMatch.id, scoreA, scoreB);
    if (res.ok) {
      setStage(res.value);
      setSelectedMatch(null);
      await saveStage(res.value);
    } else {
      alert(`Cannot report result: ${res.error.code}`);
    }
  };

  const handleUndo = async () => {
    if (!selectedMatch || !stage) return;
    const res = undoResult(stage, selectedMatch.id);
    if (res.ok) {
      setStage(res.value);
      setSelectedMatch(null);
      await saveStage(res.value);
    } else {
      alert('Cannot undo: a downstream match has already been played.');
    }
  };

  const getName = (entrantId: string | null) => entrantId ?? 'TBD';

  if (loading || !stage) {
    return (
      <main className="fade-in container" style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        Loading bracket...
      </main>
    );
  }

  const isOrganizer = user?.id === tournament?.organizer_id;
  const format: string = event?.format ?? 'single_elim';
  const isDoubleElim = format === 'double_elim';
  const isRoundRobin = format === 'round_robin';

  // Group matches by round number, properly typed
  const matchesByRound = (side: 'winners' | 'losers' | 'grand_final' | null): Record<number, Match[]> => {
    const filtered = stage.matches.filter((m: Match) => {
      if (side === null) return true;
      if (side === 'winners') return m.side === 'winners' || (m.side === null && !isDoubleElim);
      return m.side === side;
    });
    const groups: Record<number, Match[]> = {};
    for (const m of filtered) {
      if (!groups[m.round]) groups[m.round] = [];
      groups[m.round].push(m);
    }
    return groups;
  };

  const getRoundName = (roundNum: number, allRounds: number[]) => {
    const winnerRounds = allRounds.filter(r => r > 0);
    const max = Math.max(...winnerRounds, 1);
    if (roundNum === 0) return 'Grand Final';
    if (roundNum === max) return 'Finals';
    if (roundNum === max - 1) return 'Semifinals';
    if (roundNum === max - 2) return 'Quarterfinals';
    if (roundNum < 0) return `Losers Round ${Math.abs(roundNum)}`;
    return `Round ${roundNum}`;
  };

  const completedCount = stage.matches.filter((m: Match) => m.status === 'completed').length;
  const totalActive = stage.matches.filter((m: Match) => m.status !== 'pending').length;
  const progressPct = totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;

  // Tabs config
  const tabs: { key: BracketTab; label: string }[] = isDoubleElim
    ? [
        { key: 'winners', label: 'Winners Bracket' },
        { key: 'losers', label: 'Losers Bracket' },
        { key: 'grand_final', label: 'Grand Final' },
      ]
    : isRoundRobin
    ? [
        { key: 'winners', label: 'Matches' },
        { key: 'standings', label: 'Standings' },
      ]
    : [{ key: 'winners', label: 'Bracket' }];

  const renderRounds = (roundGroups: Record<number, Match[]>) => {
    const sortedRounds = Object.keys(roundGroups)
      .map(Number)
      .sort((a, b) => a - b);
    const allRounds = Object.keys(matchesByRound(null)).map(Number);

    return (
      <div className="bracket-wrapper">
        <div className="bracket-grid">
          {sortedRounds.map((roundNum) => {
            const roundMatches = roundGroups[roundNum].sort((a, b) => a.position - b.position);
            const rIdx = sortedRounds.indexOf(roundNum);
            return (
              <div key={roundNum} style={{ display: 'flex', flexDirection: 'row' }}>
                <div className="bracket-round">
                  <div className="bracket-round-header">{getRoundName(roundNum, allRounds)}</div>
                  {roundMatches.map((match: Match) => {
                    const matchSlotHeight = roundNum === 0 ? 2 : Math.pow(2, Math.max(rIdx, 0) + 1);
                    return (
                      <div
                        key={match.id}
                        className="bracket-slot"
                        style={{ minHeight: matchSlotHeight * 52 }}
                      >
                        <div
                          className={`match-block ${match.status} ${!isOrganizer ? 'readonly' : ''}`}
                          onClick={() => isOrganizer ? handleMatchClick(match) : undefined}
                          title={!isOrganizer ? '' : match.status === 'pending' ? 'Waiting for players' : 'Click to report score'}
                          style={{ cursor: !isOrganizer || match.status === 'pending' ? 'default' : 'pointer' }}
                        >
                          {/* Entrant A */}
                          <div className={`match-entrant ${
                            match.status === 'completed'
                              ? match.winnerId === match.entrantA ? 'winner' : 'loser'
                              : match.entrantA ? '' : 'tbd'
                          }`}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {match.entrantA ?? 'TBD'}
                            </span>
                            {match.status === 'completed' && (
                              <span className="match-score">{match.scoreA}</span>
                            )}
                          </div>
                          {/* Entrant B */}
                          <div className={`match-entrant ${
                            match.status === 'completed'
                              ? match.winnerId === match.entrantB ? 'winner' : 'loser'
                              : match.entrantB ? '' : 'tbd'
                          }`}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {match.entrantB ?? 'TBD'}
                            </span>
                            {match.status === 'completed' && (
                              <span className="match-score">{match.scoreB}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Connector lines */}
                {rIdx < sortedRounds.length - 1 && (
                  <div className="bracket-connector">
                    <svg className="connector-svg" width="28" height="100%" style={{ height: '100%', display: 'block' }}>
                      {roundMatches.map((_, mIdx) => {
                        const sh = (roundNum === 0 ? 2 : Math.pow(2, Math.max(rIdx, 0) + 1)) * 52;
                        const fromY = (mIdx + 0.5) * sh + 44;
                        return (
                          <line
                            key={mIdx}
                            x1="0" y1={fromY}
                            x2="28" y2={fromY}
                            stroke="var(--border-strong)"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStandings = () => {
    const standings = computeStandings(stage);
    return (
      <div className="container" style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>#</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Player</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>W</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>L</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>GW</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>GL</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.entrantId} style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'rgba(0,212,170,0.05)' : undefined }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: i === 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{s.entrantId}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--success)' }}>{s.wins}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--danger)' }}>{s.losses}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>{s.gameWins}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>{s.gameLosses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <main className="fade-in" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
          <div className="flex items-center gap-2 text-sm text-muted mb-3">
            <Link href="/" style={{ color: 'var(--text-secondary)' }}>Discover</Link>
            <span>/</span>
            <Link href={`/tournament/${id}`} style={{ color: 'var(--text-secondary)' }}>
              {tournament?.name ?? id}
            </Link>
            <span>/</span>
            <span>{event?.name ?? eventId} Bracket</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-title flex items-center gap-2">
                {event?.name ?? 'Bracket'}
                {isSaving && <span className="text-sm text-muted" style={{ fontWeight: 400 }}>Saving...</span>}
              </h1>
              <p className="text-sm text-secondary mt-1">
                {tournament?.name} &nbsp;•&nbsp; {format.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isOrganizer && (
                <Link
                  href={`/tournament/${id}/event/${eventId}/manage`}
                  className="btn btn-secondary btn-sm"
                >
                  ⚙ Manage Seeds
                </Link>
              )}
              <div style={{ textAlign: 'right' }}>
                <div className="text-sm text-muted mb-1">{completedCount}/{totalActive} matches done</div>
                <div className="progress-bar" style={{ width: 120 }}>
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Format tabs */}
          {tabs.length > 1 && (
            <div className="flex items-center gap-2 mt-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'standings'
        ? renderStandings()
        : activeTab === 'winners' && !isDoubleElim
          ? renderRounds(matchesByRound(isRoundRobin ? null : 'winners'))
          : activeTab === 'winners'
          ? renderRounds(matchesByRound('winners'))
          : activeTab === 'losers'
          ? renderRounds(matchesByRound('losers'))
          : renderRounds(matchesByRound('grand_final'))
      }

      {/* Legend */}
      <div className="container">
        <div className="flex items-center gap-4 text-xs text-muted" style={{ marginTop: 16 }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
            <span>Active {isOrganizer && '— click to report'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-surface)', border: '1px solid rgba(0,212,170,0.3)' }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-surface)', border: '1px solid var(--border)', opacity: 0.5 }} />
            <span>Pending</span>
          </div>
        </div>
      </div>

      {/* Score modal */}
      {selectedMatch && isOrganizer && (
        <div className="overlay" onClick={() => setSelectedMatch(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">
              {selectedMatch.status === 'completed' ? 'Match Result' : 'Report Score'}
            </div>

            <div className="score-reporter">
              {/* Player A */}
              <div className="player-col">
                <div className="player-name">{getName(selectedMatch.entrantA)}</div>
                {selectedMatch.status !== 'completed' ? (
                  <>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleReport(2, 0)}>Win 2–0</button>
                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => handleReport(2, 1)}>Win 2–1</button>
                  </>
                ) : (
                  <div style={{ fontSize: 32, fontWeight: 800, color: selectedMatch.winnerId === selectedMatch.entrantA ? 'var(--success)' : 'var(--text-muted)' }}>
                    {selectedMatch.scoreA}
                  </div>
                )}
              </div>

              {/* VS */}
              <div className="vs-divider">VS</div>

              {/* Player B */}
              <div className="player-col">
                <div className="player-name">{getName(selectedMatch.entrantB)}</div>
                {selectedMatch.status !== 'completed' ? (
                  <>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleReport(0, 2)}>Win 2–0</button>
                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => handleReport(1, 2)}>Win 2–1</button>
                  </>
                ) : (
                  <div style={{ fontSize: 32, fontWeight: 800, color: selectedMatch.winnerId === selectedMatch.entrantB ? 'var(--success)' : 'var(--text-muted)' }}>
                    {selectedMatch.scoreB}
                  </div>
                )}
              </div>
            </div>

            {selectedMatch.status === 'completed' && (
              <div style={{ marginTop: 24 }}>
                <div className="divider" style={{ margin: '16px 0' }} />
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <span className="badge badge-success" style={{ fontSize: 13 }}>
                    🏆 Winner: {getName(selectedMatch.winnerId)}
                  </span>
                </div>
                <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleUndo}>
                  ↩ Undo Result
                </button>
              </div>
            )}

            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12 }} onClick={() => setSelectedMatch(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
