import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Screen, Text, Button } from '../../../../../src/components/ui';
import { BracketViewer } from '../../../../../src/components/bracket/BracketViewer';
import { useTheme } from '../../../../../src/theme/tokens';
import {
  generateSingleElim,
  generateDoubleElim,
  reportResult,
  undoResult,
  StageState,
  Match,
} from '../../../../../src/lib/bracket';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { getEventById, loadStageData, saveStageData } from '../../../../../src/lib/services/event.service';
import { getTournamentById } from '../../../../../src/lib/services/tournament.service';
import { getTournamentRegistrations } from '../../../../../src/lib/services/registration.service';
import { supabase } from '../../../../../src/lib/supabase';
import type { Tournament, Event as EventType } from '../../../../../src/lib/database.types';
import { useAuth } from '../../../../../src/features/auth/AuthContext';

export default function EventBracketScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const { spacing, colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [event, setEvent] = useState<EventType | null>(null);
  const [stage, setStage] = useState<StageState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['45%'], []);

  // Load tournament, event, and bracket state from Supabase
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id || !eventId) return;
      setIsLoading(true);
      try {
        const [tData, eData] = await Promise.all([
          getTournamentById(id),
          getEventById(eventId),
        ]);
        if (cancelled) return;
        setTournament(tData);
        setEvent(eData);

        // Try to load persisted stage data first
        const existingStage = await loadStageData(eventId);
        if (cancelled) return;

        if (existingStage) {
          setStage(existingStage);
        } else if (eData) {
          // Seed entrants from registrations
          const registrations = await getTournamentRegistrations(id);
          const entrants = registrations
            .filter(r => r.status === 'confirmed' && r.event_ids.includes(eventId))
            .map((r, idx) => ({ id: r.user_id, seed: idx + 1 }));

          const seedList = entrants.length > 0
            ? entrants.slice(0, eData.max_entrants ?? 64)
            : Array.from({ length: 8 }, (_, i) => ({ id: `Player ${i + 1}`, seed: i + 1 }));

          const generated = eData.format === 'double_elim'
            ? generateDoubleElim(seedList)
            : generateSingleElim(seedList);
          setStage(generated);
        }
      } catch (e) {
        console.error('[BracketScreen] load error', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();

    // Subscribe to real-time event updates (bracket changes from other devices)
    const channel = supabase
      .channel(`event-bracket:${eventId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`,
      }, (payload) => {
        const updated = payload.new as EventType;
        if (updated.stage_data) {
          setStage(updated.stage_data as unknown as StageState);
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [id, eventId]);

  const handleMatchPress = (match: Match) => {
    if (match.status === 'pending') return;
    setSelectedMatch(match);
    bottomSheetModalRef.current?.present();
  };

  const handleReport = async (scoreA: number, scoreB: number) => {
    if (!selectedMatch || !stage || !eventId) return;
    const res = reportResult(stage, selectedMatch.id, scoreA, scoreB);
    if (res.ok) {
      const newStage = res.value;
      setStage(newStage);
      bottomSheetModalRef.current?.dismiss();
      // Persist to Supabase
      setIsSaving(true);
      try {
        await saveStageData(eventId, newStage);
      } catch (e: any) {
        Alert.alert('Save failed', e.message);
      } finally {
        setIsSaving(false);
      }
    } else {
      Alert.alert('Cannot report result', String(res.error.code));
    }
  };

  const handleUndo = async () => {
    if (!selectedMatch || !stage || !eventId) return;
    const res = undoResult(stage, selectedMatch.id);
    if (res.ok) {
      const newStage = res.value;
      setStage(newStage);
      bottomSheetModalRef.current?.dismiss();
      setIsSaving(true);
      try {
        await saveStageData(eventId, newStage);
      } catch (e: any) {
        Alert.alert('Save failed', e.message);
      } finally {
        setIsSaving(false);
      }
    } else {
      Alert.alert('Cannot undo', 'A downstream match has already been played.');
    }
  };

  // Check if user is organizer
  const isOrganizer = user?.id === tournament?.organizer_id;

  const getEntrantName = (eid: string | null) => eid ?? 'TBD';

  if (isLoading || !stage) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <BlurView intensity={0} style={[styles.backCircle, { backgroundColor: colors.tintBg }]}>
            <Text variant="headline" style={{ color: colors.label, lineHeight: 24, paddingBottom: 1 }}>‹</Text>
          </BlurView>
        </Pressable>

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text variant="title" numberOfLines={1}>{event?.name ?? 'Bracket'}</Text>
          <Text variant="caption" color="secondaryLabel" numberOfLines={1}>
            {tournament?.name}
          </Text>
        </View>

        {isOrganizer && !isSaving && (
          <Pressable
            onPress={() => router.push(`/tournament/${id}/event/${eventId}/manage` as any)}
            hitSlop={8}
            style={{ marginRight: spacing.s, backgroundColor: colors.tintBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
          >
            <Text variant="caption" color="accent" weight="700">Manage</Text>
          </Pressable>
        )}
        {isSaving && <ActivityIndicator color={colors.accent} style={{ marginRight: spacing.s }} />}
      </View>

      <View style={styles.bracketWrapper}>
        <BracketViewer stage={stage} onMatchPress={handleMatchPress} />
      </View>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: colors.background }}
      >
        <BottomSheetView style={[styles.sheetContent, { padding: spacing.xl }]}>
          <Text variant="title" style={[styles.sheetTitle, { marginBottom: spacing.l }]}>
            Report Score
          </Text>
          {selectedMatch && (
            <View style={styles.matchControls}>
              <View style={[styles.playerControl, { gap: spacing.s }]}>
                <Text variant="body" weight="600" numberOfLines={1}>
                  {getEntrantName(selectedMatch.entrantA)}
                </Text>
                <Button label="Win (2-0)" onPress={() => handleReport(2, 0)} />
                <Button label="Win (2-1)" onPress={() => handleReport(2, 1)} />
              </View>
              <View style={[styles.vsContainer, { paddingHorizontal: spacing.m }]}>
                <Text variant="subheadline" color="secondaryLabel">VS</Text>
              </View>
              <View style={[styles.playerControl, { gap: spacing.s }]}>
                <Text variant="body" weight="600" numberOfLines={1}>
                  {getEntrantName(selectedMatch.entrantB)}
                </Text>
                <Button label="Win (2-0)" onPress={() => handleReport(0, 2)} />
                <Button label="Win (2-1)" onPress={() => handleReport(1, 2)} />
              </View>
            </View>
          )}

          {selectedMatch?.status === 'completed' && (
            <View style={[styles.undoContainer, { marginTop: spacing.xl }]}>
              <Button variant="destructive" label="Undo Match" onPress={handleUndo} style={{ width: '100%' }} />
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  bracketWrapper: {
    flex: 1,
  },
  sheetContent: {
    flex: 1,
  },
  sheetTitle: {
    textAlign: 'center',
  },
  matchControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerControl: {
    flex: 1,
    alignItems: 'center',
  },
  vsContainer: {},
  undoContainer: {},
});
