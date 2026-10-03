import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { Screen } from '../../src/components/ui/Screen';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useTheme } from '../../src/theme/tokens';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/features/auth/AuthContext';
import { useOrganizerStats, useMyTournaments } from '../../src/hooks/useTournaments';

export default function OrganizerScreen() {
  const { colors, spacing, radii } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useOrganizerStats(user?.id ?? null);
  const { data: tournaments, isLoading: tournamentsLoading } = useMyTournaments(user?.id ?? null);

  const isLoading = statsLoading || tournamentsLoading;
  
  const totalRegistrations = stats?.reduce((acc, s) => acc + (s.registration_count || 0), 0) || 0;
  const totalGrossRevenue = stats?.reduce((acc, s) => acc + (s.gross_revenue || 0), 0) || 0;
  const totalCheckIns = stats?.reduce((acc, s) => acc + (s.checked_in_count || 0), 0) || 0;
  const totalDisputes = stats?.reduce((acc, s) => acc + (s.open_dispute_count || 0), 0) || 0;
  
  const checkInRate = totalRegistrations > 0 ? Math.round((totalCheckIns / totalRegistrations) * 100) : 0;

  return (
    <Screen>
      <Stack.Screen 
        options={{ 
          title: t('organizer.title'),
          headerRight: () => (
             <Pressable onPress={() => router.push('/tournament/create' as any)}>
               <SymbolView name="plus" tintColor={colors.label} size={24} />
             </Pressable>
          )
        }} 
      />
      
      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : stats?.length === 0 || !stats ? (
        <EmptyState
          icon="chart.bar.doc.horizontal"
          title="No Events Yet"
          description="Create your first event to start tracking analytics, managing brackets, and resolving disputes."
          actionLabel="+ New Event"
          onAction={() => router.push('/tournament/create' as any)}
        />
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.l, paddingBottom: 100, gap: spacing.xl }}>
          
          {/* Actionable Alerts */}
          {totalDisputes > 0 && (
            <View style={{ gap: spacing.m }}>
              <Text variant="title">{t('organizer.requiresAttention')}</Text>
              <View style={{ gap: spacing.s }}>
                <Pressable
                  onPress={() => {
                    // Navigate to first tournament that has disputes
                    const withDispute = stats?.find(s => (s.open_dispute_count ?? 0) > 0);
                    if (withDispute) router.push(`/tournament/${withDispute.tournament_id}`);
                  }}
                >
                  <Card style={{ padding: spacing.m, flexDirection: 'row', alignItems: 'center', gap: spacing.m, borderLeftWidth: 4, borderLeftColor: colors.destructive }}>
                    <SymbolView name="exclamationmark.triangle.fill" tintColor={colors.destructive} size={28} />
                    <View style={{ flex: 1 }}>
                      <Text variant="headline" style={{ color: colors.destructive }}>{totalDisputes} {t('organizer.activeDisputes')}</Text>
                      <Text variant="caption" style={{ color: colors.secondaryLabel, marginTop: 2 }}>{t('organizer.dispDesc') || 'Players reported conflicting scores. Tap to review.'}</Text>
                    </View>
                    <SymbolView name="chevron.right" tintColor={colors.secondaryLabel} size={16} />
                  </Card>
                </Pressable>
              </View>
            </View>
          )}

          {/* KPIs Grid */}
          <View style={{ gap: spacing.m }}>
            <Text variant="title">{t('organizer.kpis')}</Text>
            <View style={{ gap: spacing.s }}>
              <View style={{ flexDirection: 'row', gap: spacing.s }}>
                <Card style={{ flex: 1, padding: spacing.l }}>
                  <Text variant="caption" style={{ color: colors.secondaryLabel, textTransform: 'uppercase', marginBottom: spacing.xs }}>{t('organizer.registrations')}</Text>
                  <Text variant="title">{totalRegistrations}</Text>
                </Card>
                <Card style={{ flex: 1, padding: spacing.l }}>
                  <Text variant="caption" style={{ color: colors.secondaryLabel, textTransform: 'uppercase', marginBottom: spacing.xs }}>{t('organizer.checkIn')}</Text>
                  <Text variant="title">{checkInRate}%</Text>
                </Card>
              </View>
              
              <View style={{ flexDirection: 'row', gap: spacing.s }}>
                <Card style={{ flex: 1, padding: spacing.l }}>
                  <Text variant="caption" style={{ color: colors.secondaryLabel, textTransform: 'uppercase', marginBottom: spacing.xs }}>{t('organizer.grossRev')}</Text>
                  <Text variant="title" style={{ color: colors.success }}>${totalGrossRevenue}</Text>
                </Card>
              </View>
            </View>
          </View>

          {/* Managed Events */}
          <View style={{ gap: spacing.m }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="title">{t('organizer.liveEvents')}</Text>
              <Pressable style={{ backgroundColor: colors.backgroundGrouped, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.capsule }} onPress={() => router.push('/tournament/create' as any)}>
                <Text style={{ color: colors.label, fontWeight: '600' }}>+ New</Text>
              </Pressable>
            </View>
            
            <View style={{ gap: spacing.m }}>
              {(tournaments || []).map(tData => {
                 const stat = stats.find(s => s.tournament_id === tData.id);
                 const dateStr = new Date(tData.starts_at).toLocaleDateString();
                 return (
                  <Pressable key={tData.id} onPress={() => router.push(`/tournament/${tData.id}`)}>
                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                      {tData.banner_url ? (
                        <Image source={{ uri: tData.banner_url }} style={{ width: '100%', height: 100 }} />
                      ) : (
                        <View style={{ width: '100%', height: 100, backgroundColor: colors.separator, justifyContent: 'center', alignItems: 'center' }}>
                          <SymbolView name="trophy.fill" tintColor={colors.secondaryLabel} size={40} />
                        </View>
                      )}
                      
                      <View style={{ padding: spacing.m }}>
                        <View style={{ flexDirection: 'row', gap: spacing.s, alignItems: 'flex-start', marginBottom: spacing.m }}>
                          {tData.thumbnail_url && (
                            <Image source={{ uri: tData.thumbnail_url }} style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.separator }} />
                          )}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                              <Text variant="headline" style={{ flex: 1 }}>{tData.name}</Text>
                              <View style={{ backgroundColor: tData.status === 'in_progress' ? 'rgba(50, 215, 75, 0.2)' : colors.tintBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                <Text variant="caption" style={{ color: tData.status === 'in_progress' ? colors.success : colors.label, fontWeight: 'bold' }}>{tData.status}</Text>
                              </View>
                            </View>
                            <Text variant="subheadline" style={{ color: colors.secondaryLabel }}>{tData.game} • {dateStr}</Text>
                          </View>
                        </View>
                        
                        {/* Stats */}
                        <View style={{ gap: 6, marginBottom: spacing.m }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text variant="caption" style={{ color: colors.secondaryLabel }}>{t('organizer.registrations')}</Text>
                            <Text variant="caption" style={{ color: colors.secondaryLabel }}>{stat?.registration_count || 0}</Text>
                          </View>
                        </View>

                        {(stat?.open_dispute_count || 0) > 0 && (
                          <View style={{ backgroundColor: 'rgba(255, 82, 82, 0.1)', padding: spacing.s, borderRadius: radii.card, alignItems: 'center' }}>
                            <Text style={{ color: colors.destructive, fontWeight: '600' }}>{t('organizer.resolveDisputes')} ({stat?.open_dispute_count})</Text>
                          </View>
                        )}
                        
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>

        </ScrollView>
      )}
    </Screen>
  );
}
