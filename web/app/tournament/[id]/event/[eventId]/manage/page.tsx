'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { deleteEvent } from '@/lib/api/tournament';
import { useAuth } from '@/lib/AuthContext';
import { generateSingleElim, generateDoubleElim, generateRoundRobin } from '@/lib/bracket';
import type { Entrant, StageState } from '@/lib/bracket';

interface Props {
  params: Promise<{ id: string; eventId: string }>;
}

export interface ManagedEntrant {
  id: string; // unique identifier
  userId?: string; // if from online registration
  name: string;
  teamTag?: string;
  seed: number;
  checkedIn: boolean;
  isWalkIn?: boolean;
}

const GAME_PRO_ROSTERS: Record<string, string[]> = {
  overwatch: ['Proper', 'Lip', 'Shu', 'Profit', 'Fearless', 'Viol2t', 'Hanbin', 'Pelican', 'Fielder', 'Sp9rk1e', 'Chiyo', 'Smurf', 'Kai', 'Hawk', 'Kevster', 'Twilight'],
  smash: ['MkLeo', 'Sparg0', 'Acola', 'Tweek', 'Light', 'Sonix', 'Riddles', 'Glutonny', 'Miya', 'Kola', 'Zomba', 'Dabuz', 'Tea', 'Shuton', 'Asimo', 'ApolloKage'],
  melee: ['Mang0', 'Zain', 'Cody Schwab', 'Jmook', 'Hungrybox', 'Plup', 'aMSa', 'Leffen', 'KStick', 'Moky', 'Wizzrobe', 'Ginger', 'S2J', 'Axe', 'SFAT', 'Soonsay'],
  fighter: ['Daigo', 'Tokido', 'Punk', 'MenaRD', 'SonicFox', 'Justin Wong', 'AngryBird', 'Big Bird', 'EndingWalker', 'Fuudo', 'Problem X', 'Bonchan', 'Luffy', 'GamerBee', 'NL', 'OilKing'],
  street: ['Daigo', 'Tokido', 'Punk', 'MenaRD', 'SonicFox', 'Justin Wong', 'AngryBird', 'Big Bird', 'EndingWalker', 'Fuudo', 'Problem X', 'Bonchan', 'Luffy', 'GamerBee', 'NL', 'OilKing'],
  fortnite: ['Bugha', 'Mongraal', 'Clix', 'TaySon', 'MrSavage', 'EpikWhale', 'Mero', 'Cooper', 'Veno', 'Queasy', 'Malibuca', 'Th0masHD', 'Kami', 'Setty', 'JannisZ', 'Pinq'],
  valorant: ['TenZ', 'aspas', 'Derke', 'Chronicle', 'Boaster', 'Jinggg', 'yay', 'f0rsakeN', 'Cryocells', 'ScreaM', 'cNed', 'Alfajer', 'Demon1', 'something', 'crashies', 'Victor'],
  default: ['Viper', 'Phoenix', 'Ace', 'Ghost', 'Titan', 'Apex', 'Blitz', 'Shadow', 'Frost', 'Echo', 'Rogue', 'Specter', 'Cipher', 'Blaze', 'Nova', 'Storm']
};

function getProRosterForGame(gameName?: string): string[] {
  const g = (gameName || '').toLowerCase();
  for (const [key, roster] of Object.entries(GAME_PRO_ROSTERS)) {
    if (key !== 'default' && g.includes(key)) {
      return roster;
    }
  }
  return GAME_PRO_ROSTERS.default;
}

const getGameEmoji = (game?: string) => {
  const g = (game || '').toLowerCase();
  if (g.includes('fortnite')) return '🪂';
  if (g.includes('overwatch')) return '🛡️';
  if (g.includes('fighter') || g.includes('sf')) return '🥊';
  if (g.includes('melee') || g.includes('smash')) return '⚔️';
  if (g.includes('valorant') || g.includes('strike') || g.includes('cs')) return '🎯';
  if (g.includes('rocket')) return '🚗';
  if (g.includes('league') || g.includes('lol')) return '🧙';
  if (g.includes('apex')) return '⚡';
  return '🏆';
};

export default function ManageBracketPage({ params }: Props) {
  const { id, eventId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tournament, setTournament] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [entrants, setEntrants] = useState<ManagedEntrant[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'single_elim' | 'double_elim' | 'round_robin' | 'swiss'>('double_elim');
  const [activeTab, setActiveTab] = useState<'entrants' | 'format' | 'stations'>('entrants');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals / Quick Actions State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('');
  const [bulkInput, setBulkInput] = useState('');

  // Stations Management
  const [stations, setStations] = useState<Array<{ id: string; name: string; streamUrl?: string }>>([
    { id: 'st-1', name: 'Station 1 (Main Stream)' },
    { id: 'st-2', name: 'Station 2 (Arena A)' },
    { id: 'st-3', name: 'Station 3 (Arena B)' },
  ]);
  const [newStationName, setNewStationName] = useState('');

  const [bracketGenerated, setBracketGenerated] = useState(false);
  const [stageState, setStageState] = useState<StageState | null>(null);

  useEffect(() => {
    // Bug #7 fix: wait for auth to resolve before fetching — prevents
    // the brief "Access Denied" flash shown to the real organizer.
    if (authLoading) return;

    async function load() {
      const { data: tData } = await supabase.from('tournaments').select('*').eq('id', id).single();
      const { data: eData } = await supabase.from('events').select('*').eq('id', eventId).single();

      if (!tData || !eData) {
        setLoading(false);
        return;
      }

      setTournament(tData);
      setEvent(eData);
      setSelectedFormat(eData.format || 'double_elim');

      const isGenerated = !!eData.stage_data && Array.isArray(eData.stage_data.matches) && eData.stage_data.matches.length > 0;
      setBracketGenerated(isGenerated);
      if (isGenerated) {
        setStageState(eData.stage_data as StageState);
      }

      // 1. Fetch confirmed web registrations
      const { data: regs } = await supabase
        .from('registrations')
        .select('user_id, event_ids, checked_in')
        .eq('tournament_id', id)
        .eq('status', 'confirmed')
        .order('registered_at', { ascending: true });

      const eventRegs = (regs || []).filter((r: any) => r.event_ids?.includes(eventId));
      const userIds = Array.from(new Set(eventRegs.map((r: any) => r.user_id)));
      const profilesMap = new Map<string, { display_name: string; handle: string }>();

      if (userIds.length > 0) {
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, display_name, handle')
          .in('id', userIds);
        (pData || []).forEach((p: any) => profilesMap.set(p.id, p));
      }

      const webEntrants: ManagedEntrant[] = eventRegs.map((r: any, idx: number) => {
        const p = profilesMap.get(r.user_id);
        const displayName = p?.display_name || p?.handle || `Player ${idx + 1}`;
        return {
          id: `web-${r.user_id}`,
          userId: r.user_id,
          name: displayName,
          seed: idx + 1,
          checkedIn: r.checked_in ?? false,
          isWalkIn: false,
        };
      });

      // 2. Load manual / walk-in entrants saved in stage_data
      let savedManuals: ManagedEntrant[] = [];
      if (eData.stage_data?.pending_entrants && Array.isArray(eData.stage_data.pending_entrants)) {
        savedManuals = eData.stage_data.pending_entrants.filter((m: ManagedEntrant) => m.isWalkIn);
      } else if (isGenerated && Array.isArray(eData.stage_data.entrants)) {
        // Recover entrant names from generated stage
        savedManuals = eData.stage_data.entrants
          .filter((e: Entrant) => !webEntrants.some(w => w.name === e.id))
          .map((e: Entrant) => ({
            id: `manual-${e.id}`,
            name: e.id,
            seed: e.seed,
            checkedIn: true,
            isWalkIn: true,
          }));
      }

      // Merge and sort by seed
      const combined = [...webEntrants, ...savedManuals];
      combined.sort((a, b) => a.seed - b.seed);
      // Re-normalize seed numbers 1..N
      const normalized = combined.map((item, idx) => ({ ...item, seed: idx + 1 }));

      setEntrants(normalized);

      // Load saved stations if present
      if (eData.stage_data?.stations && Array.isArray(eData.stage_data.stations)) {
        setStations(eData.stage_data.stations);
      }

      setLoading(false);
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, eventId, authLoading]);

  // Persist manual entrants & stations state to event.stage_data.
  // Bug #5 fix: when bracket is already generated we must NOT overwrite
  // the live stage_data, but we still need to save check-in state for
  // walk-in entrants.  We do this by merging into the existing stage object.
  const persistDraftState = async (updatedEntrants: ManagedEntrant[], updatedStations = stations) => {
    try {
      if (bracketGenerated) {
        // Only persist walk-in check-in state inside the existing stage_data
        const walkInStates = updatedEntrants
          .filter(e => e.isWalkIn)
          .map(e => ({ id: e.id, name: e.name, checkedIn: e.checkedIn }));
        if (walkInStates.length === 0) return;
        // Merge walk-in check-ins into stage_data without touching matches
        const { data: fresh } = await supabase
          .from('events')
          .select('stage_data')
          .eq('id', eventId)
          .single();
        if (!fresh?.stage_data) return;
        const merged = {
          ...(fresh.stage_data as any),
          walkin_checkins: walkInStates,
        };
        await supabase.from('events').update({ stage_data: merged }).eq('id', eventId);
        return;
      }
      await supabase
        .from('events')
        .update({
          stage_data: {
            pending_entrants: updatedEntrants,
            stations: updatedStations,
          },
        })
        .eq('id', eventId);
    } catch (e) {
      console.warn('Failed to persist draft state:', e);
    }
  };

  // Move seed position
  const moveSeed = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= entrants.length) return;
    const newList = [...entrants];
    [newList[index], newList[targetIdx]] = [newList[targetIdx], newList[index]];
    const renumbered = newList.map((r, i) => ({ ...r, seed: i + 1 }));
    setEntrants(renumbered);
    persistDraftState(renumbered);
  };

  // Randomize / Shuffle Seeds
  const handleShuffleSeeds = () => {
    if (entrants.length < 2) return;
    const shuffled = [...entrants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const renumbered = shuffled.map((r, i) => ({ ...r, seed: i + 1 }));
    setEntrants(renumbered);
    persistDraftState(renumbered);
    setStatusMsg({ text: '🎲 Seeds successfully randomized!', type: 'success' });
  };

  // Sort Alphabetically
  const handleSortAlphabetical = () => {
    if (entrants.length < 2) return;
    const sorted = [...entrants].sort((a, b) => a.name.localeCompare(b.name));
    const renumbered = sorted.map((r, i) => ({ ...r, seed: i + 1 }));
    setEntrants(renumbered);
    persistDraftState(renumbered);
    setStatusMsg({ text: '🔤 Seeds sorted alphabetically (A → Z)', type: 'success' });
  };

  // Invert / Reverse Seeds
  const handleReverseSeeds = () => {
    if (entrants.length < 2) return;
    const reversed = [...entrants].reverse();
    const renumbered = reversed.map((r, i) => ({ ...r, seed: i + 1 }));
    setEntrants(renumbered);
    persistDraftState(renumbered);
    setStatusMsg({ text: '↕ Seeding order reversed!', type: 'success' });
  };

  // Batch Check-in
  const handleCheckInAll = async (checked: boolean) => {
    const updated = entrants.map(e => ({ ...e, checkedIn: checked }));
    setEntrants(updated);

    // Update real web registrations in Supabase
    const webUserIds = entrants.filter(e => e.userId).map(e => e.userId!);
    if (webUserIds.length > 0) {
      await supabase
        .from('registrations')
        .update({ checked_in: checked })
        .eq('tournament_id', id)
        .in('user_id', webUserIds);
    }
    persistDraftState(updated);
    setStatusMsg({
      text: checked ? `✓ All ${entrants.length} entrants checked in!` : '↺ Check-in statuses reset.',
      type: 'success',
    });
  };

  // Toggle single player check-in
  const handleToggleCheckIn = async (entrantId: string) => {
    const target = entrants.find(e => e.id === entrantId);
    if (!target) return;
    const nextVal = !target.checkedIn;
    const updated = entrants.map(e => (e.id === entrantId ? { ...e, checkedIn: nextVal } : e));
    setEntrants(updated);

    if (target.userId) {
      await supabase
        .from('registrations')
        .update({ checked_in: nextVal })
        .eq('tournament_id', id)
        .eq('user_id', target.userId);
    }
    persistDraftState(updated);
  };

  // Add Walk-In Entrant
  const handleAddSinglePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newPlayerName.trim();
    if (!cleanName) return;

    const fullTag = newPlayerTeam.trim() ? `[${newPlayerTeam.trim()}] ${cleanName}` : cleanName;
    const newEntrant: ManagedEntrant = {
      id: `walkin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: fullTag,
      seed: entrants.length + 1,
      checkedIn: true,
      isWalkIn: true,
    };

    const updated = [...entrants, newEntrant];
    setEntrants(updated);
    persistDraftState(updated);
    setNewPlayerName('');
    setNewPlayerTeam('');
    setShowAddModal(false);
    setStatusMsg({ text: `✓ Added player "${fullTag}" at Seed #${newEntrant.seed}`, type: 'success' });
  };

  // Quick-Add Demo Entrants
  const handleQuickFillDemo = (count: number) => {
    const rosterPool = getProRosterForGame(tournament?.game);
    const existingNames = new Set(entrants.map(e => e.name.toLowerCase()));
    const available = rosterPool.filter(name => !existingNames.has(name.toLowerCase()));

    const toAdd: ManagedEntrant[] = [];
    for (let i = 0; i < count; i++) {
      const name = available[i] || `Pro Competitor ${entrants.length + i + 1}`;
      toAdd.push({
        id: `demo-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
        name,
        seed: entrants.length + i + 1,
        checkedIn: true,
        isWalkIn: true,
      });
    }

    const updated = [...entrants, ...toAdd];
    setEntrants(updated);
    persistDraftState(updated);
    setStatusMsg({ text: `⚡ Successfully populated ${count} competitive players!`, type: 'success' });
  };

  // Bulk Import Entrants
  const handleBulkImport = () => {
    const lines = bulkInput
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    const newItems: ManagedEntrant[] = lines.map((line, idx) => ({
      id: `bulk-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      name: line,
      seed: entrants.length + idx + 1,
      checkedIn: true,
      isWalkIn: true,
    }));

    const updated = [...entrants, ...newItems];
    setEntrants(updated);
    persistDraftState(updated);
    setBulkInput('');
    setShowBulkModal(false);
    setStatusMsg({ text: `📋 Imported ${newItems.length} entrants from list!`, type: 'success' });
  };

  // Remove Entrant
  const handleRemoveEntrant = async (entrantId: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from this bracket?`)) return;

    const target = entrants.find(e => e.id === entrantId);
    if (target?.userId) {
      // Remove from web registration record in DB
      try {
        const { data: reg } = await supabase
          .from('registrations')
          .select('id, event_ids')
          .eq('tournament_id', id)
          .eq('user_id', target.userId)
          .single();

        if (reg) {
          const updatedEvents = (reg.event_ids || []).filter((eId: string) => eId !== eventId);
          if (updatedEvents.length === 0) {
            await supabase.from('registrations').update({ status: 'cancelled', event_ids: [] }).eq('id', reg.id);
          } else {
            await supabase.from('registrations').update({ event_ids: updatedEvents }).eq('id', reg.id);
          }
        }
      } catch (err) {
        console.warn('Error updating web registration on removal:', err);
      }
    }

    const filtered = entrants.filter(e => e.id !== entrantId);
    const renumbered = filtered.map((e, idx) => ({ ...e, seed: idx + 1 }));
    setEntrants(renumbered);
    persistDraftState(renumbered);
    setStatusMsg({ text: `Removed "${name}" from seeding.`, type: 'success' });
  };

  // Clear all walk-in/demo entrants
  const handleClearAllWalkIns = () => {
    if (!window.confirm('Clear all walk-in and demo entrants? (Web registrants will remain)')) return;
    const kept = entrants.filter(e => !e.isWalkIn);
    const renumbered = kept.map((e, idx) => ({ ...e, seed: idx + 1 }));
    setEntrants(renumbered);
    persistDraftState(renumbered);
    setStatusMsg({ text: 'Cleared manual entrants.', type: 'success' });
  };

  // Format Switcher
  const handleFormatChange = async (newFormat: 'single_elim' | 'double_elim' | 'round_robin' | 'swiss') => {
    setSelectedFormat(newFormat);
    try {
      await supabase.from('events').update({ format: newFormat }).eq('id', eventId);
      setEvent((prev: any) => ({ ...prev, format: newFormat }));
      setStatusMsg({ text: `✓ Event format updated to ${formatLabel[newFormat]}!`, type: 'success' });
    } catch (err: any) {
      setStatusMsg({ text: `Failed to update format: ${err.message}`, type: 'error' });
    }
  };

  // Station Management
  const handleAddStation = () => {
    const clean = newStationName.trim();
    if (!clean) return;
    const newSt = { id: `st-${Date.now()}`, name: clean };
    const updated = [...stations, newSt];
    setStations(updated);
    setNewStationName('');
    persistDraftState(entrants, updated);
  };

  const handleRemoveStation = (stId: string) => {
    const updated = stations.filter(s => s.id !== stId);
    setStations(updated);
    persistDraftState(entrants, updated);
  };

  // Generate Bracket
  const handleGenerateBracket = async () => {
    if (entrants.length < 2) {
      setStatusMsg({ text: 'At least 2 entrants are required to generate a bracket.', type: 'error' });
      return;
    }
    // Bug #1 fix: Swiss format has no engine implementation — show a clear error
    // instead of silently falling through to single elimination.
    if (selectedFormat === 'swiss') {
      setStatusMsg({
        text: '⚠️ Swiss format is not yet supported. Please select Single Elimination, Double Elimination, or Round Robin.',
        type: 'error',
      });
      return;
    }
    setSaving(true);
    setStatusMsg(null);

    try {
      // Disambiguate duplicate names if any
      const nameCounts: Record<string, number> = {};
      entrants.forEach(r => { nameCounts[r.name] = (nameCounts[r.name] || 0) + 1; });
      const seenNames: Record<string, number> = {};

      const bracketEntrants: Entrant[] = entrants.map((r, i) => {
        let entrantName = r.name;
        if (nameCounts[r.name] > 1) {
          seenNames[r.name] = (seenNames[r.name] || 0) + 1;
          entrantName = `${r.name} (#${seenNames[r.name]})`;
        }
        return { id: entrantName, seed: i + 1 };
      });

      let stage: StageState;
      if (selectedFormat === 'double_elim') {
        stage = generateDoubleElim(bracketEntrants);
      } else if (selectedFormat === 'round_robin') {
        stage = generateRoundRobin(bracketEntrants);
      } else {
        stage = generateSingleElim(bracketEntrants);
      }

      // Attach stations to stage data
      (stage as any).stations = stations;

      const { error: saveErr } = await supabase
        .from('events')
        .update({
          format: selectedFormat,
          stage_data: stage as any,
          status: 'in_progress',
        })
        .eq('id', eventId);

      if (saveErr) throw saveErr;

      setBracketGenerated(true);
      setStageState(stage);
      router.push(`/tournament/${id}/event/${eventId}/bracket`);
    } catch (e: any) {
      setStatusMsg({ text: e.message || 'Failed to generate bracket', type: 'error' });
      setSaving(false);
    }
  };

  // Reset Bracket
  const handleResetBracket = async () => {
    if (!window.confirm('⚠️ This will erase the current bracket, match scores, and standings. Are you sure?')) return;
    setSaving(true);
    // Bug #3 fix: also clear stale rankings so re-running the bracket
    // doesn't upsert on top of old placement rows.
    await supabase.from('rankings').delete().eq('event_id', eventId);
    await supabase.from('events').update({ stage_data: null, status: 'registration_open' }).eq('id', eventId);
    setBracketGenerated(false);
    setStageState(null);
    setSaving(false);
    setStatusMsg({ text: '↩ Bracket has been reset. You can now re-seed and re-generate.', type: 'success' });
  };

  // Delete event safely
  const handleDeleteEvent = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete event "${event?.name}"? All brackets and matches will be deleted.`)) return;
    try {
      await deleteEvent(eventId);
      router.push(`/tournament/${id}`);
    } catch (err: any) {
      setStatusMsg({ text: `Failed to delete event: ${err.message}`, type: 'error' });
    }
  };

  if (loading) {
    return (
      <main className="container fade-in" style={{ paddingTop: 80, textAlign: 'center' }}>
        <p className="text-secondary">Loading organizer workspace...</p>
      </main>
    );
  }

  if (!tournament || user?.id !== tournament.organizer_id) {
    return (
      <main className="container fade-in" style={{ paddingTop: 80, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 className="text-display" style={{ fontSize: 24 }}>Access Denied</h1>
        <p className="text-secondary mt-2">Only the tournament organizer can access Organizer Mode.</p>
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

  const checkedInCount = entrants.filter(r => r.checkedIn).length;
  const checkInPercent = entrants.length > 0 ? Math.round((checkedInCount / entrants.length) * 100) : 0;

  // Bracket estimation calculations
  const calculateBracketBlueprint = () => {
    const count = entrants.length;
    if (count < 2) return null;

    let power = 1;
    while (power < count) power <<= 1;
    const byes = power - count;

    if (selectedFormat === 'single_elim') {
      const rounds = Math.log2(power);
      const matches = count - 1;
      return { rounds: `${rounds} Knockout Rounds`, matches, byes, type: 'Direct Knockout' };
    }
    if (selectedFormat === 'double_elim') {
      const wRounds = Math.log2(power);
      const lRounds = (wRounds - 1) * 2;
      const matches = 2 * count - 2; // +1 possible for grand final reset
      return { rounds: `${wRounds} Winners + ${lRounds} Losers Rounds`, matches: `${matches} - ${matches + 1}`, byes, type: 'Double Chance' };
    }
    if (selectedFormat === 'round_robin') {
      const matches = (count * (count - 1)) / 2;
      return { rounds: `${count - 1} Pool Rounds`, matches, byes: 0, type: 'All-Play-All' };
    }
    return { rounds: 'Variable', matches: 'Dynamic', byes: 0, type: 'Record-Based' };
  };

  const blueprint = calculateBracketBlueprint();

  // Completed matches counter if live
  const completedMatches = stageState?.matches?.filter(m => m.status === 'completed').length ?? 0;
  const totalMatches = stageState?.matches?.length ?? 0;

  return (
    <main className="container fade-in" style={{ paddingTop: 32, paddingBottom: 100, maxWidth: 1040 }}>
      {/* ── 1. Top Breadcrumbs & Quick Tournament Link ── */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <Link href="/organizer" style={{ color: 'var(--text-secondary)' }}>Organizer</Link>
          <span>/</span>
          <Link href={`/tournament/${id}`} style={{ color: 'var(--text-secondary)' }}>{tournament.name}</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{event?.name}</span>
          <span>/</span>
          <span>Command Center</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/tournament/${id}`} className="btn btn-ghost btn-sm" style={{ fontSize: 13 }}>
            👁 View Public Event
          </Link>
          <Link href={`/tournament/${id}/edit`} className="btn btn-secondary btn-sm" style={{ fontSize: 13 }}>
            ⚙ Tournament Settings
          </Link>
        </div>
      </div>

      {/* ── 2. Command Center Header ── */}
      <div className="card mb-6" style={{ padding: '28px', background: '#FFFFFF', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-accent" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚡ ORGANIZER COMMAND CENTER
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {getGameEmoji(tournament?.game)} {tournament?.game}
              </span>
            </div>

            <h1 className="text-display" style={{ fontSize: 32, marginBottom: 6 }}>
              {event?.name} — Bracket & Seeding
            </h1>
            <p className="text-secondary text-sm">
              Configure seeds, walk-in check-ins, tournament format rules, and station routing.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {bracketGenerated ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/tournament/${id}/event/${eventId}/bracket`} className="btn btn-primary btn-lg">
                  🎯 Open Live Bracket →
                </Link>
                <button
                  onClick={handleResetBracket}
                  disabled={saving}
                  className="btn btn-ghost btn-sm text-danger"
                  style={{ color: 'var(--danger)', border: '1px solid #FECACA', background: '#FEF2F2' }}
                >
                  ↩ Reset Bracket
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateBracket}
                disabled={saving || entrants.length < 2}
                className="btn btn-primary btn-lg"
                style={{
                  boxShadow: entrants.length >= 2 ? '0 4px 14px rgba(37,99,235,0.25)' : 'none',
                  opacity: entrants.length < 2 ? 0.6 : 1,
                }}
              >
                {saving ? 'Generating Bracket...' : `🚀 Launch ${formatLabel[selectedFormat]} Bracket (${entrants.length} Entrants)`}
              </button>
            )}
          </div>
        </div>

        {/* Real-time KPI Pills Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid var(--border)'
        }}>
          <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Competitors
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
              {entrants.length} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>seeded</span>
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Check-In Status
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: checkedInCount === entrants.length && entrants.length > 0 ? 'var(--success)' : 'var(--text)', marginTop: 2 }}>
              {checkedInCount} / {entrants.length} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>({checkInPercent}%)</span>
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Selected Format
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
              {formatLabel[selectedFormat] ?? selectedFormat}
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Stage Progress
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: bracketGenerated ? 'var(--accent)' : 'var(--warning)', marginTop: 4 }}>
              {bracketGenerated ? `● Live (${completedMatches}/${totalMatches} matches)` : '⚡ Seeding & Roster'}
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert Notification */}
      {statusMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: statusMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${statusMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          color: statusMsg.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: 14,
          fontWeight: 500
        }}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} style={{ color: 'inherit', fontWeight: 700, fontSize: 16 }}>×</button>
        </div>
      )}

      {/* ── 3. Navigation Tabs ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '2px solid var(--border)',
        marginBottom: 24,
      }}>
        <button
          onClick={() => setActiveTab('entrants')}
          style={{
            padding: '12px 20px',
            fontWeight: 700,
            fontSize: 14,
            color: activeTab === 'entrants' ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'entrants' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'color 0.2s',
          }}
        >
          <span>👥</span> Entrants & Seeding ({entrants.length})
        </button>

        <button
          onClick={() => setActiveTab('format')}
          style={{
            padding: '12px 20px',
            fontWeight: 700,
            fontSize: 14,
            color: activeTab === 'format' ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'format' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'color 0.2s',
          }}
        >
          <span>⚙️</span> Format & Blueprint
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          style={{
            padding: '12px 20px',
            fontWeight: 700,
            fontSize: 14,
            color: activeTab === 'stations' ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'stations' ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -2,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'color 0.2s',
          }}
        >
          <span>📺</span> Stations & Routing ({stations.length})
        </button>
      </div>

      {/* ── TAB 1: ENTRANTS & SEEDING ── */}
      {activeTab === 'entrants' && (
        <div>
          {/* Action Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>+</span> Add Player
              </button>

              <button
                onClick={() => setShowBulkModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>📋</span> Bulk Paste
              </button>

              <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 'var(--radius-sm)', padding: 2 }}>
                <button
                  onClick={() => handleQuickFillDemo(8)}
                  className="btn btn-ghost btn-sm"
                  title="Populate 8 realistic players tailored to this title"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                >
                  ⚡ +8 Demo Players
                </button>
                <button
                  onClick={() => handleQuickFillDemo(16)}
                  className="btn btn-ghost btn-sm"
                  title="Populate 16 realistic players tailored to this title"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                >
                  +16 Demo
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={handleShuffleSeeds}
                disabled={entrants.length < 2}
                className="btn btn-secondary btn-sm"
                title="Randomize entrant seeds"
                style={{ fontSize: 12 }}
              >
                🎲 Shuffle
              </button>

              <button
                onClick={handleSortAlphabetical}
                disabled={entrants.length < 2}
                className="btn btn-secondary btn-sm"
                title="Sort A-Z"
                style={{ fontSize: 12 }}
              >
                🔤 Sort A-Z
              </button>

              <button
                onClick={handleReverseSeeds}
                disabled={entrants.length < 2}
                className="btn btn-secondary btn-sm"
                title="Reverse Seeding Order"
                style={{ fontSize: 12 }}
              >
                ↕ Invert
              </button>

              <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

              <button
                onClick={() => handleCheckInAll(true)}
                disabled={entrants.length === 0 || checkedInCount === entrants.length}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12, color: 'var(--success)' }}
              >
                ✓ Check In All
              </button>

              <button
                onClick={() => handleCheckInAll(false)}
                disabled={entrants.length === 0 || checkedInCount === 0}
                className="btn btn-ghost btn-sm text-secondary"
                style={{ fontSize: 12 }}
              >
                ↺ Reset
              </button>

              {entrants.some(e => e.isWalkIn) && (
                <button
                  onClick={handleClearAllWalkIns}
                  className="btn btn-ghost btn-sm text-danger"
                  style={{ fontSize: 12, color: 'var(--danger)' }}
                  title="Remove all walk-in/demo entrants"
                >
                  Clear Demos
                </button>
              )}
            </div>
          </div>

          {/* Entrants Seeding Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{
              padding: '14px 20px',
              background: '#F8FAFC',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Seeding Order & Roster ({entrants.length} competitors)
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Use ↑ / ↓ arrows or drag handles to modify seeds
              </span>
            </div>

            {entrants.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>👥</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  No Entrants Seeded Yet
                </h3>
                <p className="text-secondary text-sm" style={{ maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Add offline walk-in competitors, paste a roster list, or populate demo entrants with one click to test the tournament bracket immediately.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    + Add Walk-In Player
                  </button>
                  <button onClick={() => handleQuickFillDemo(8)} className="btn btn-secondary">
                    ⚡ Populate 8 Pro Players
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {entrants.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 20px',
                      borderBottom: i < entrants.length - 1 ? '1px solid var(--border)' : 'none',
                      gap: 16,
                      background: r.checkedIn ? '#FFFFFF' : '#FBFBFC',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Seed Number Badge */}
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: i === 0 ? '#FEF3C7' : i === 1 ? '#F1F5F9' : i === 2 ? '#FFEDD5' : '#F8FAFC',
                      color: i === 0 ? '#B45309' : i === 1 ? '#475569' : i === 2 ? '#C2410C' : 'var(--text-secondary)',
                      border: `1px solid ${i === 0 ? '#FDE68A' : i === 1 ? '#E2E8F0' : i === 2 ? '#FED7AA' : 'var(--border)'}`,
                      fontWeight: 750,
                      fontSize: 13,
                      flexShrink: 0,
                    }}>
                      #{r.seed}
                    </div>

                    {/* Player Info */}
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 650, color: 'var(--text)', fontSize: 15 }}>
                          {r.name}
                        </span>
                        {r.isWalkIn ? (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            background: '#F1F5F9',
                            color: '#64748B',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                          }}>
                            Walk-In
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                          }}>
                            Online Verified
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: r.checkedIn ? 'var(--success)' : 'var(--text-muted)', marginTop: 2 }}>
                        {r.checkedIn ? '● Ready for bracket' : '○ Pending check-in'}
                      </div>
                    </div>

                    {/* Toggle Check-in button */}
                    <button
                      onClick={() => handleToggleCheckIn(r.id)}
                      className={`btn btn-sm ${r.checkedIn ? 'btn-ghost' : 'btn-secondary'}`}
                      style={{
                        minWidth: 100,
                        fontSize: 12,
                        background: r.checkedIn ? '#ECFDF5' : undefined,
                        color: r.checkedIn ? '#059669' : undefined,
                        border: r.checkedIn ? '1px solid #A7F3D0' : undefined,
                      }}
                    >
                      {r.checkedIn ? '✓ Checked In' : 'Check In'}
                    </button>

                    {/* Reorder Buttons (Move Up / Down) */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        disabled={i === 0}
                        onClick={() => moveSeed(i, -1)}
                        className="btn btn-ghost btn-sm"
                        style={{ width: 28, height: 28, padding: 0, borderRadius: 6, opacity: i === 0 ? 0.3 : 1 }}
                        title="Increase Seed (Move Up)"
                      >
                        ▲
                      </button>
                      <button
                        disabled={i === entrants.length - 1}
                        onClick={() => moveSeed(i, 1)}
                        className="btn btn-ghost btn-sm"
                        style={{ width: 28, height: 28, padding: 0, borderRadius: 6, opacity: i === entrants.length - 1 ? 0.3 : 1 }}
                        title="Lower Seed (Move Down)"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveEntrant(r.id, r.name)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)', padding: '4px 8px', fontSize: 14 }}
                      title="Remove player"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: FORMAT & BLUEPRINT ── */}
      {activeTab === 'format' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 className="text-title" style={{ fontSize: 20, marginBottom: 6 }}>Tournament Format & Rules</h2>
            <p className="text-secondary text-sm">
              Select the tournament format for this bracket. Rules and round counts adapt dynamically.
            </p>
          </div>

          {/* Format Selection Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              {
                id: 'double_elim',
                name: 'Double Elimination',
                desc: 'Winners & Losers brackets. Competitors get a second chance before elimination. Features Grand Finals reset.',
                icon: '⚔️',
                recommended: true
              },
              {
                id: 'single_elim',
                name: 'Single Elimination',
                desc: 'Sudden death knockout format. High intensity, fast progression, best for large competitor pools.',
                icon: '🏆',
                recommended: false
              },
              {
                id: 'round_robin',
                name: 'Round Robin',
                desc: 'Every competitor plays against all other entrants. Standings computed by win/loss and head-to-head records.',
                icon: '🔄',
                recommended: false
              },
              {
                id: 'swiss',
                name: 'Swiss Format',
                desc: 'Non-eliminating format where competitors with similar scores face each other each round. Ideal for card/tactical titles.',
                icon: '🌐',
                recommended: false
              }
            ].map(fmt => {
              const isSelected = selectedFormat === fmt.id;
              return (
                <div
                  key={fmt.id}
                  onClick={() => handleFormatChange(fmt.id as any)}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? '#F0FDF4' : '#FFFFFF',
                    border: `2px solid ${isSelected ? 'var(--success)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>{fmt.icon}</span>
                    {fmt.recommended && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#DCFCE7', color: '#166534', textTransform: 'uppercase' }}>
                        Esports Standard
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                    {fmt.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {fmt.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Live Bracket Blueprint */}
          {blueprint && (
            <div className="card" style={{ padding: '24px', background: '#F8FAFC', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>📐</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  Bracket Blueprint ({entrants.length} Competitors)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Structure</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{blueprint.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rounds</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{blueprint.rounds}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Matches</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{blueprint.matches}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Byes</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: blueprint.byes === 0 ? 'var(--success)' : 'var(--warning)', marginTop: 2 }}>
                    {blueprint.byes === 0 ? '0 (Clean Power of 2)' : `${blueprint.byes} Round-1 Byes`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: STATIONS & STREAM ROUTING ── */}
      {activeTab === 'stations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <h2 className="text-title" style={{ fontSize: 20, marginBottom: 6 }}>Tournament Stations & Match Queues</h2>
              <p className="text-secondary text-sm">
                Assign live matches to physical setups, streams, or virtual match lobbies.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. Station 4 (Stream B)"
                value={newStationName}
                onChange={e => setNewStationName(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  outline: 'none',
                  minWidth: 220
                }}
              />
              <button onClick={handleAddStation} className="btn btn-primary btn-sm">
                + Add Station
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {stations.map(st => (
              <div
                key={st.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: '1px solid var(--border)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                    <span style={{ fontWeight: 650, fontSize: 14, color: 'var(--text)' }}>{st.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Ready for match assignment
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveStation(st.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', fontSize: 13, padding: '4px 8px' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Safety Bar / Delete Event ── */}
      <div style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Tournament ID: <code style={{ fontSize: 11, background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>{id.slice(0, 8)}</code> • Event: <code style={{ fontSize: 11, background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>{eventId.slice(0, 8)}</code>
        </div>

        <button
          onClick={handleDeleteEvent}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>🗑</span> Delete This Event
        </button>
      </div>

      {/* ── MODAL: ADD SINGLE PLAYER ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: 440,
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Add Walk-In Competitor</h3>
              <button onClick={() => setShowAddModal(false)} style={{ fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>

            <form onSubmit={handleAddSinglePlayer}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Player Tag / Gamertag *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mang0 or Faker"
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Club / Team Sponsor Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. C9 or T1"
                  value={newPlayerTeam}
                  onChange={e => setNewPlayerTeam(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Add to Seeding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: BULK PASTE ENTRANTS ── */}
      {showBulkModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: 500,
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Bulk Import Entrants</h3>
              <button onClick={() => setShowBulkModal(false)} style={{ fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>
            <p className="text-secondary text-xs mb-4">
              Paste a list of competitor gamer tags (one per line). They will be added to the seeding list in order.
            </p>

            <textarea
              rows={8}
              placeholder={`Ace\nShadow\nViper\nPhoenix\nTitan`}
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                fontFamily: 'monospace',
                fontSize: 13,
                marginBottom: 20,
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowBulkModal(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button type="button" onClick={handleBulkImport} className="btn btn-primary btn-sm">
                Import Competitors
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
