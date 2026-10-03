import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import { Screen, Text, Button, Card } from '../../../../../src/components/ui';
import { useTheme } from '../../../../../src/theme/tokens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../../src/features/auth/AuthContext';
import { supabase } from '../../../../../src/lib/supabase';
import {
  generateSingleElim,
  generateDoubleElim,
  generateRoundRobin,
} from '../../../../../src/lib/bracket';
import type { Entrant, StageState } from '../../../../../src/lib/bracket';
import { saveStageData } from '../../../../../src/lib/services/event.service';
import { getTournamentRegistrations } from '../../../../../src/lib/services/registration.service';
import type { Tournament, Event as EventType } from '../../../../../src/lib/database.types';

interface Registrant {
  userId: string;
  name: string;
  seed: number;
  checkedIn: boolean;
}

export default function ManageBracketScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const { spacing, colors, radii, shadows } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [event, setEvent] = useState<EventType | null>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bracketExists, setBracketExists] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id || !eventId) return;
      try {
        const { data: tData } = await supabase.from('tournaments').select('*').eq('id', id).single();
        const { data: eData } = await supabase.from('events').select('*').eq('id', eventId).single();
        setTournament(tData as Tournament);
        setEvent(eData as EventType);
        setBracketExists(!!eData?.stage_data);

        const regs = await getTournamentRegistrations(id);
        const eventRegs = regs.filter(r => r.event_ids.includes(eventId));
        setRegistrants(
          eventRegs.map((r: any, idx: number) => ({
            userId: r.user_id,
            name: r.profile?.display_name || r.profile?.handle || r.user_id.slice(0, 8),
            seed: idx + 1,
            checkedIn: r.checked_in ?? false,
          }))
        );
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, eventId]);

  const moveSeed = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= registrants.length) return;
    const newList = [...registrants];
    [newList[index], newList[targetIdx]] = [newList[targetIdx], newList[index]];
    setRegistrants(newList.map((r, i) => ({ ...r, seed: i + 1 })));
  };

  const handleCheckIn = async (userId: string) => {
    try {
      await supabase
        .from('registrations')
        .update({ checked_in: true })
        .eq('user_id', userId)
        .eq('tournament_id', id);
      setRegistrants(prev => prev.map(r => r.userId === userId ? { ...r, checkedIn: true } : r));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleGenerateBracket = async () => {
    if (!event || registrants.length < 2) {
      Alert.alert('Not enough entrants', 'At least 2 entrants are required.');
      return;
    }

    Alert.alert(
      'Generate Bracket',
      `Generate ${event.format.replace(/_/g, ' ')} bracket with ${registrants.length} players?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setSaving(true);
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

              await saveStageData(eventId, stage);
              setBracketExists(true);
              router.push(`/tournament/${id}/event/${eventId}/bracket` as any);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleResetBracket = () => {
    Alert.alert(
      'Reset Bracket',
      'This will erase all match results and regenerate from scratch. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await supabase.from('events').update({ stage_data: null, status: 'pending' }).eq('id', eventId);
              setBracketExists(false);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen backgroundColor="backgroundGrouped" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }

  if (!tournament || !event || user?.id !== tournament.organizer_id) {
    return (
      <Screen backgroundColor="backgroundGrouped" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="title" style={{ marginBottom: spacing.m }}>🔒 Access Denied</Text>
        <Text color="secondaryLabel" style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          Only the tournament organizer can manage brackets.
        </Text>
        <Button label="Go Back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const checkedInCount = registrants.filter(r => r.checkedIn).length;

  const formatLabel: Record<string, string> = {
    single_elim: 'Single Elimination',
    double_elim: 'Double Elimination',
    round_robin: 'Round Robin',
    swiss: 'Swiss',
  };

  return (
    <Screen backgroundColor="backgroundGrouped">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ padding: spacing.m, gap: spacing.l }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={[styles.backCircle, { backgroundColor: colors.tintBg }]}
            >
              <Text variant="headline" style={{ color: colors.label, lineHeight: 24, paddingBottom: 1 }}>‹</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text variant="largeTitle">{event.name}</Text>
              <Text variant="caption" color="secondaryLabel">
                {formatLabel[event.format] ?? event.format} • {registrants.length} players • {checkedInCount} checked in
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={{ flexDirection: 'row', gap: spacing.m }}>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <Text variant="caption" color="secondaryLabel">Entrants</Text>
              <Text variant="largeTitle" color="accent">{registrants.length}</Text>
            </Card>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <Text variant="caption" color="secondaryLabel">Checked In</Text>
              <Text variant="largeTitle" style={{ color: colors.success }}>{checkedInCount}</Text>
            </Card>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <Text variant="caption" color="secondaryLabel">Status</Text>
              <Text variant="footnote" weight="700" color={bracketExists ? 'accent' : 'secondaryLabel'}>
                {bracketExists ? 'Live' : 'Setup'}
              </Text>
            </Card>
          </View>

          {/* Entrant List */}
          <View>
            <Text variant="title" style={{ marginBottom: spacing.m }}>Seeding Order</Text>
            {registrants.length === 0 ? (
              <Card style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Text color="secondaryLabel">No registrants for this event yet.</Text>
              </Card>
            ) : (
              registrants.map((r, i) => (
                <Card
                  key={r.userId}
                  style={[
                    styles.entrantRow,
                    { borderColor: r.checkedIn ? colors.success : colors.separator },
                  ]}
                >
                  {/* Seed badge */}
                  <View style={[
                    styles.seedBadge,
                    { backgroundColor: i === 0 ? colors.accent : colors.tintBg },
                  ]}>
                    <Text
                      variant="footnote"
                      weight="700"
                      style={{ color: i === 0 ? '#fff' : colors.label }}
                    >
                      {r.seed}
                    </Text>
                  </View>

                  {/* Name + status */}
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="600">{r.name}</Text>
                    {r.checkedIn && (
                      <Text variant="caption" style={{ color: colors.success }}>✓ Checked in</Text>
                    )}
                  </View>

                  {/* Check-in button */}
                  {!r.checkedIn && (
                    <Button
                      label="Check In"
                      variant="secondary"
                      onPress={() => handleCheckIn(r.userId)}
                      style={{ paddingHorizontal: spacing.m, height: 36 }}
                    />
                  )}

                  {/* Reorder */}
                  <View style={{ gap: 2 }}>
                    <Pressable
                      onPress={() => moveSeed(i, -1)}
                      disabled={i === 0}
                      style={[styles.arrowBtn, { backgroundColor: colors.background, opacity: i === 0 ? 0.3 : 1 }]}
                    >
                      <Text variant="caption" style={{ color: colors.label }}>↑</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => moveSeed(i, 1)}
                      disabled={i === registrants.length - 1}
                      style={[styles.arrowBtn, { backgroundColor: colors.background, opacity: i === registrants.length - 1 ? 0.3 : 1 }]}
                    >
                      <Text variant="caption" style={{ color: colors.label }}>↓</Text>
                    </Pressable>
                  </View>
                </Card>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.cta, { backgroundColor: colors.backgroundGrouped, borderTopColor: colors.separator }]}>
        {saving ? (
          <ActivityIndicator color={colors.accent} />
        ) : bracketExists ? (
          <View style={{ gap: spacing.s, flexDirection: 'row' }}>
            <Button
              label="View Bracket"
              onPress={() => router.push(`/tournament/${id}/event/${eventId}/bracket` as any)}
              style={{ flex: 1 }}
            />
            <Button
              label="Reset"
              variant="destructive"
              onPress={handleResetBracket}
              style={{ flex: 0, paddingHorizontal: spacing.m }}
            />
          </View>
        ) : (
          <Button
            label={`Generate ${formatLabel[event.format] ?? 'Bracket'}`}
            onPress={handleGenerateBracket}
            loading={saving}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  statCard: { padding: 16, alignItems: 'center', gap: 4 },
  entrantRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1 },
  seedBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  arrowBtn: { width: 28, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cta: { padding: 16, paddingBottom: 32, borderTopWidth: 1 },
});
