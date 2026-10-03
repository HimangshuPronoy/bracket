import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Screen, Text, Card, Button } from '../../../src/components/ui';
import { useTheme } from '../../../src/theme/tokens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { useTournament } from '../../../src/hooks/useTournaments';
import { useRegisterForTournament, useRegistrationForTournament } from '../../../src/hooks/useRegistrations';
import { useAuth } from '../../../src/features/auth/AuthContext';
import type { Event } from '../../../src/lib/database.types';

export default function TournamentRegisterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing, colors, radii, shadows } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: tournament, isLoading: tournamentLoading } = useTournament(id ?? null);
  const { data: existingReg } = useRegistrationForTournament(user?.id ?? null, id ?? null);
  const registerMutation = useRegisterForTournament();

  const events = tournament?.events ?? [];
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  if (tournamentLoading) {
    return (
      <Screen>
        <ActivityIndicator style={{ flex: 1 }} />
      </Screen>
    );
  }

  if (!tournament) {
    return (
      <Screen>
        <Text>{t('tournament.notFound')}</Text>
      </Screen>
    );
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const handleRegister = async () => {
    if (selectedEvents.length === 0 || !user) return;

    try {
      await registerMutation.mutateAsync({
        userId: user.id,
        tournamentId: tournament!.id,
        eventIds: selectedEvents,
      });
      router.replace(`/tournament/${tournament.id}`);
    } catch (e: any) {
      Alert.alert('Registration failed', e.message);
    }
  };

  const totalFee = tournament.registration_fee * selectedEvents.length;

  return (
    <Screen backgroundColor="backgroundGrouped">
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={{ padding: spacing.m, gap: spacing.l }}>

          {/* Top bar with back button */}
          <View style={[styles.topBar, { marginTop: spacing.xs }]}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <BlurView intensity={60} tint="light" style={[styles.backBlur, { backgroundColor: colors.tintBg }]}>
                <Text variant="headline" style={{ color: colors.label, lineHeight: 24, paddingBottom: 1 }}>‹</Text>
              </BlurView>
            </Pressable>
            <Text variant="headline">{t('register.title')}</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Tournament name */}
          <View style={[styles.tournamentBanner, { backgroundColor: colors.background }]}>
            <Text variant="title">{tournament.name}</Text>
            <Text variant="subheadline" color="secondaryLabel" style={{ marginTop: 4 }}>
              {tournament.registration_fee === 0
                ? '✅ Free Entry'
                : `💳 $${tournament.registration_fee} entry fee per event`}
            </Text>
            {existingReg && existingReg.status === 'confirmed' && (
              <View style={{ marginTop: spacing.s, backgroundColor: colors.tintBg, padding: spacing.s, borderRadius: radii.button }}>
                <Text variant="caption" color="accent" weight="600">✓ Already registered</Text>
              </View>
            )}
          </View>

          {/* Event selection */}
          <View>
            <Text variant="headline" style={{ marginBottom: spacing.m }}>{t('register.selectEvents')}</Text>
            {events.length === 0 ? (
              <Text color="secondaryLabel">No events available yet.</Text>
            ) : (
              events.map((event: Event) => {
                const isSelected = selectedEvents.includes(event.id);
                const alreadyIn = existingReg?.event_ids.includes(event.id);
                return (
                  <Card
                    key={event.id}
                    style={[styles.eventCard, isSelected && { borderColor: colors.accent, borderWidth: 2 }]}
                    onPress={() => toggleEvent(event.id)}
                  >
                    <View style={styles.eventRow}>
                      <View style={{ flex: 1 }}>
                        <Text variant="headline">{event.name}</Text>
                        <Text variant="subheadline" color="secondaryLabel">
                          👥 {event.entrants_count} {t('tournament.entrants')}
                          {event.max_entrants ? ` / ${event.max_entrants}` : ''}
                        </Text>
                        {alreadyIn && <Text variant="caption" color="accent">Already registered</Text>}
                      </View>
                      <View style={[
                        styles.checkCircle,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.tintBg,
                          borderColor: isSelected ? colors.accent : colors.separator,
                        }
                      ]}>
                        {isSelected && (
                          <SymbolView name="checkmark" tintColor={colors.background} size={14} weight="bold" fallback={<></>} />
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>

          {/* Summary + CTA */}
          {selectedEvents.length > 0 && (
            <View style={[styles.summary, { backgroundColor: colors.tintBg, borderRadius: radii.card }]}>
              <Text variant="subheadline" color="secondaryLabel">
                {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''} selected
                {tournament.registration_fee > 0 ? ` · Total: $${totalFee}` : ' · Free'}
              </Text>
            </View>
          )}

          <Button
            label={
              selectedEvents.length === 0
                ? t('register.selectEvents')
                : tournament.registration_fee === 0
                  ? `${t('register.completeRegistration')} — Free`
                  : `${t('register.completeRegistration')} — $${totalFee}`
            }
            onPress={handleRegister}
            disabled={selectedEvents.length === 0}
            loading={registerMutation.isPending}
          />

          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBlur: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tournamentBanner: { padding: 16, borderRadius: 16 },
  eventCard: { marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  eventRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  summary: { padding: 14 },
});
