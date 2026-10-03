import React from 'react';
import { ScrollView, View, StyleSheet, Image, Pressable, ActivityIndicator } from 'react-native';
import { Screen, Text, Card, EmptyState } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SymbolView } from 'expo-symbols';
import { BlurView } from 'expo-blur';
import { useMyRegistrations } from '../../src/hooks/useRegistrations';
import { useAuth } from '../../src/features/auth/AuthContext';
import type { RegistrationWithTournament } from '../../src/lib/database.types';

export default function MyEventsScreen() {
  const { spacing, colors, radii, shadows } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: registrations, isLoading } = useMyRegistrations(user?.id ?? null);

  return (
    <Screen backgroundColor="backgroundGrouped">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: spacing.m, paddingTop: spacing.xl, gap: spacing.m }}>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.m }}>
            <Text variant="largeTitle">{t('myEvents.title')}</Text>
            <View style={{ backgroundColor: colors.tintBg, padding: spacing.s, borderRadius: radii.button }}>
              <SymbolView name="calendar" tintColor={colors.accent} size={24} />
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : !registrations || registrations.length === 0 ? (
            <EmptyState
              icon="calendar.badge.plus"
              title={t('myEvents.emptyTitle')}
              description={t('myEvents.emptyDesc')}
              actionLabel="Find Tournaments"
              onAction={() => router.push('/' as any)}
            />
          ) : (
            registrations.map((reg: RegistrationWithTournament) => {
              const tournament = reg.tournament;
              if (!tournament) return null;

              const dateStr = new Date(tournament.starts_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <Pressable
                  key={reg.id}
                  onPress={() => router.push(`/tournament/${tournament.id}`)}
                  style={[styles.card, shadows.md, { backgroundColor: colors.background, borderRadius: radii.card }]}
                >
                  {/* Thumbnail Header */}
                  <View style={{ height: 140, position: 'relative' }}>
                    {tournament.banner_url ? (
                      <Image
                        source={{ uri: tournament.banner_url }}
                        style={{ width: '100%', height: '100%', borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ width: '100%', height: '100%', backgroundColor: colors.separator, borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card, justifyContent: 'center', alignItems: 'center' }}>
                        <SymbolView name="trophy.fill" tintColor={colors.secondaryLabel} size={40} />
                      </View>
                    )}
                    <View style={{ position: 'absolute', top: 12, right: 12 }}>
                      <BlurView intensity={80} tint="dark" style={styles.dateBadge}>
                        <Text variant="caption" style={{ color: '#fff', fontWeight: 'bold' }}>
                          {dateStr}
                        </Text>
                      </BlurView>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={{ padding: spacing.m }}>
                    <Text variant="title" weight="700" style={{ marginBottom: 4 }}>{tournament.name}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.m }}>
                      <SymbolView name="gamecontroller.fill" tintColor={colors.secondaryLabel} size={14} />
                      <Text variant="subheadline" color="secondaryLabel">{tournament.game}</Text>
                    </View>

                    {/* Registered Events Pills */}
                    <View style={{ gap: spacing.xs }}>
                      <Text variant="caption" color="secondaryLabel" style={{ fontWeight: '600', textTransform: 'uppercase' }}>
                        Registered Events ({reg.event_ids.length})
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {reg.event_ids.map((eid) => {
                          // Find the event name from the joined events array
                          const eventName = (reg as any).events?.find((e: any) => e.id === eid)?.name ?? eid.slice(0, 8) + '…';
                          return (
                            <View key={eid} style={[styles.eventPill, { backgroundColor: colors.tintBg, borderColor: colors.separator }]}>
                              <Text variant="caption" color="label" weight="600">
                                {eventName}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Footer / CTA */}
                    <View style={[styles.cardFooter, { borderTopColor: colors.separator, marginTop: spacing.m, paddingTop: spacing.m }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <SymbolView name="mappin.and.ellipse" tintColor={colors.accentSecondary} size={16} />
                        <Text variant="caption" color="secondaryLabel">
                          {tournament.is_online ? 'Online' : tournament.location ?? 'In-Person'}
                        </Text>
                      </View>
                      <Text variant="caption" color="accent" weight="bold">View Details →</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, overflow: 'hidden' },
  dateBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, overflow: 'hidden' },
  eventPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
});
