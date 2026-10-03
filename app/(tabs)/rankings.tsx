import React from 'react';
import { ScrollView, View, StyleSheet, Image, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Screen, Text, Card } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../src/features/auth/AuthContext';
import { useUserRankings } from '../../src/hooks/useRankings';
import type { RankingWithDetails } from '../../src/lib/database.types';

const { width } = Dimensions.get('window');

export default function RankingsScreen() {
  const { spacing, colors, radii, shadows } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: rankings, isLoading } = useUserRankings(user?.id ?? null);

  const sorted = (rankings ?? []).slice().sort((a: RankingWithDetails, b: RankingWithDetails) => a.placement - b.placement);
  const bestRank = sorted.length > 0 ? sorted[0] : null;

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return colors.accentSecondary;
  };

  return (
    <Screen backgroundColor="backgroundGrouped">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: spacing.m, paddingTop: spacing.xl, gap: spacing.l }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text variant="largeTitle">{t('rankings.title')}</Text>
              <Text variant="body" color="secondaryLabel" style={{ marginTop: 4 }}>
                {t('rankings.subtitle')}
              </Text>
            </View>
            <View style={{ backgroundColor: colors.tintBg, padding: spacing.s, borderRadius: radii.button }}>
              <SymbolView name="trophy.fill" tintColor={colors.warning} size={28} />
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
          ) : sorted.length === 0 ? (
            <Card style={{ alignItems: 'center', padding: spacing.xl }}>
              <SymbolView name="medal" tintColor={colors.secondaryLabel} size={48} style={{ marginBottom: spacing.m }} />
              <Text variant="headline">{t('rankings.emptyTitle')}</Text>
              <Text variant="body" color="secondaryLabel" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
                {t('rankings.emptyDesc')}
              </Text>
            </Card>
          ) : (
            <View style={{ gap: spacing.l }}>

              {/* Hero Card for Best Rank */}
              {bestRank && (
                <View>
                  <Text variant="title" style={{ marginBottom: spacing.s }}>Highlights</Text>
                  <Pressable
                    onPress={() => router.push(`/tournament/${bestRank.tournament_id}`)}
                    style={[styles.heroCard, shadows.floating, { backgroundColor: colors.background, borderRadius: radii.card }]}
                  >
                    {bestRank.tournament.banner_url ? (
                      <Image
                        source={{ uri: bestRank.tournament.banner_url }}
                        style={{ width: '100%', height: 180, borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ width: '100%', height: 180, backgroundColor: colors.separator, borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card, justifyContent: 'center', alignItems: 'center' }}>
                        <SymbolView name="trophy.fill" tintColor={colors.secondaryLabel} size={48} />
                      </View>
                    )}
                    <BlurView intensity={100} tint="dark" style={styles.heroOverlay}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
                        <View style={[styles.bigRankBadge, { borderColor: getRankColor(bestRank.placement) }]}>
                          <Text variant="largeTitle" style={{ color: getRankColor(bestRank.placement), fontWeight: '900', fontSize: 40 }}>
                            {bestRank.placement}
                          </Text>
                          <Text variant="caption" style={{ color: getRankColor(bestRank.placement), fontWeight: '700', marginTop: -4 }}>PLACE</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="title" style={{ color: '#fff', marginBottom: 2 }}>{bestRank.tournament.name}</Text>
                          <Text variant="subheadline" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            {bestRank.event.name}
                          </Text>
                        </View>
                      </View>
                    </BlurView>
                  </Pressable>
                </View>
              )}

              {/* All Placements */}
              <View>
                <Text variant="title" style={{ marginBottom: spacing.s }}>All Placements</Text>
                {sorted.map((item: RankingWithDetails) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/tournament/${item.tournament_id}`)}
                    style={[styles.listCard, shadows.sm, { backgroundColor: colors.background, borderRadius: radii.card }]}
                  >
                    {item.tournament.banner_url ? (
                      <Image
                        source={{ uri: item.tournament.banner_url }}
                        style={{ width: 80, height: 80, borderRadius: radii.button }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ width: 80, height: 80, borderRadius: radii.button, backgroundColor: colors.separator, justifyContent: 'center', alignItems: 'center' }}>
                        <SymbolView name="trophy.fill" tintColor={colors.secondaryLabel} size={28} />
                      </View>
                    )}

                    <View style={{ flex: 1, paddingVertical: 4 }}>
                      <Text variant="headline" numberOfLines={1}>{item.tournament.name}</Text>
                      <Text variant="subheadline" color="secondaryLabel" style={{ marginTop: 2 }}>
                        {item.event.name} • {item.event.entrants_count} {t('tournament.entrants')}
                      </Text>
                      <Text variant="caption" color="secondaryLabel" style={{ marginTop: 2 }}>
                        {item.wins}W – {item.losses}L
                      </Text>
                    </View>

                    <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.placement) + '20', borderRadius: radii.button }]}>
                      <Text variant="title" style={{ color: getRankColor(item.placement), fontWeight: '800' }}>
                        #{item.placement}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

            </View>
          )}

        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: { overflow: 'hidden', position: 'relative' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  bigRankBadge: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.4)' },
  listCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12, gap: 16 },
  rankBadge: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
