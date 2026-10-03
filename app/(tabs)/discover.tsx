import React, { useState } from 'react';
import {
  ScrollView, View, StyleSheet, TextInput, Pressable, Platform, Image, ActivityIndicator
} from 'react-native';
import { Screen, Text, Card, EmptyState } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { useDiscoverTournaments } from '../../src/hooks/useTournaments';
import { TournamentWithEvents } from '../../src/lib/database.types';

export default function DiscoverScreen() {
  const { spacing, colors, radii, shadows } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Use the hook to fetch real tournaments from Supabase
  const { data: tournaments, isLoading } = useDiscoverTournaments();

  const filteredTournaments = (tournaments || []).filter(tournament => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tournament.name.toLowerCase().includes(q) ||
      tournament.game.toLowerCase().includes(q) ||
      (tournament.location && tournament.location.toLowerCase().includes(q))
    );
  });

  const renderHorizontalSection = (titleKey: string, tags: string[]) => {
    const tagsLower = tags.map(t => t.toLowerCase());
    const filtered = filteredTournaments.filter(t =>
      t.tags?.some(tag => tagsLower.includes(tag.toLowerCase()))
    );
    if (filtered.length === 0) return null;

    return (
      <View style={{ marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.m, marginBottom: spacing.s }}>
          <Text variant="title">{t(titleKey)}</Text>
          <Pressable onPress={() => setSearchQuery(tags[0])}>
            <Text variant="subheadline" color="accent">{t('discover.seeAll')}</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.m, gap: spacing.m }}>
          {filtered.map((tournament) => {
            const dateStr = new Date(tournament.starts_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            return (
              <Pressable
                key={tournament.id}
                onPress={() => router.push(`/tournament/${tournament.id}`)}
                style={[styles.cardWrapper, shadows.md, { borderRadius: radii.card, backgroundColor: colors.background }]}
              >
                {/* Banner */}
                {tournament.banner_url ? (
                  <Image
                    source={{ uri: tournament.banner_url }}
                    style={{ width: 280, height: 150, borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: 280, height: 150, borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card, backgroundColor: colors.separator, justifyContent: 'center', alignItems: 'center' }}>
                    <SymbolView name="trophy.fill" tintColor={colors.secondaryLabel} size={40} />
                  </View>
                )}

                {/* Badges row overlaid on bottom of image */}
                <View style={styles.badgeRow}>
                  {tournament.is_online ? (
                    <View style={[styles.pill, { backgroundColor: 'rgba(41, 204, 122, 0.9)' }]}>
                      <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>🌐 Online</Text>
                    </View>
                  ) : (
                    <View style={[styles.pill, { backgroundColor: 'rgba(255,113,67,0.9)' }]}>
                      <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>📍 In-Person</Text>
                    </View>
                  )}
                  {tournament.prize_pool && (
                    <View style={[styles.pill, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                      <Text variant="caption" style={{ color: '#FFB74D', fontWeight: '700' }}>🏆 {tournament.prize_pool}</Text>
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={{ padding: spacing.m }}>
                  {/* Tags */}
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.xs, flexWrap: 'wrap' }}>
                    {tournament.tags?.map(tag => (
                      <View key={tag} style={{ backgroundColor: colors.tintBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.capsule }}>
                        <Text variant="caption" color="accentSecondary">{t(`tags.${tag.toLowerCase()}`, tag)}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: spacing.s, alignItems: 'center' }}>
                    {tournament.thumbnail_url && (
                      <Image source={{ uri: tournament.thumbnail_url }} style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.separator }} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text variant="headline" style={{ marginBottom: 2 }} numberOfLines={1}>{tournament.name}</Text>
                      <Text variant="subheadline" color="secondaryLabel" numberOfLines={1}>{tournament.game}</Text>
                    </View>
                  </View>
                  <Text variant="caption" color="secondaryLabel" style={{ marginTop: 4 }}>📅 {dateStr}</Text>

                  {/* Footer */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.s, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.separator }}>
                    <Text variant="caption" color="secondaryLabel">
                      {tournament.registration_fee === 0 ? '✅ Free Entry' : `Entry: $${tournament.registration_fee}`}
                    </Text>
                    <Text variant="caption" color="accent">View →</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <Screen backgroundColor="backgroundGrouped">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: spacing.m, paddingTop: spacing.xl }}>
          <Text variant="largeTitle" style={{ marginBottom: spacing.l }}>{t('discover.title')}</Text>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.background, borderRadius: radii.button, marginBottom: spacing.xl }, shadows.sm]}>
            <SymbolView name="magnifyingglass" tintColor={colors.secondaryLabel} size={20} style={{ marginLeft: spacing.s }} />
            <TextInput
              style={[styles.searchInput, { color: colors.label, paddingHorizontal: spacing.s, paddingVertical: spacing.m }]}
              placeholder={t('discover.searchPlaceholder')}
              placeholderTextColor={colors.secondaryLabel}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : filteredTournaments.length === 0 ? (
          <EmptyState
             icon="magnifyingglass"
             title={searchQuery ? "No results found" : "No Tournaments"}
             description={searchQuery ? "Try a different search term." : "There are currently no tournaments available."}
          />
        ) : (
          <>
            {renderHorizontalSection('discover.featuredEvents', ['Featured'])}
            {renderHorizontalSection('discover.onlineTournaments', ['Online'])}
            {renderHorizontalSection('discover.upcomingLeagues', ['League'])}
            {renderHorizontalSection('discover.localUpcoming', ['Upcoming'])}
            
            {/* Show all other tournaments if they don't have any of the recognized tags */}
            {(() => {
              const tagsToExclude = ['featured', 'online', 'league', 'upcoming'];
              const taggedIds = new Set(
                filteredTournaments
                  .filter(t => t.tags?.some(tag => tagsToExclude.includes(tag.toLowerCase())))
                  .map(t => t.id)
              );
              const remaining = filteredTournaments.filter(t => !taggedIds.has(t.id));
              
              if (remaining.length === 0) return null;
              return (
                 <View style={{ paddingHorizontal: spacing.m, gap: spacing.m }}>
                    <Text variant="title" style={{ marginBottom: spacing.s }}>More Tournaments</Text>
                    {remaining.map((tournament) => {
                      const dateStr = new Date(tournament.starts_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      return (
                         <Pressable
                            key={tournament.id}
                            onPress={() => router.push(`/tournament/${tournament.id}`)}
                            style={[{ backgroundColor: colors.background, borderRadius: radii.card, padding: spacing.m, flexDirection: 'row', gap: spacing.m }, shadows.sm]}
                         >
                            {tournament.thumbnail_url ? (
                              <Image source={{ uri: tournament.thumbnail_url }} style={{ width: 80, height: 80, borderRadius: radii.card }} />
                            ) : (
                              <View style={{ width: 80, height: 80, borderRadius: radii.card, backgroundColor: colors.separator, justifyContent: 'center', alignItems: 'center' }}>
                                 <SymbolView name="trophy.fill" tintColor={colors.secondaryLabel} size={30} />
                              </View>
                            )}
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                               <Text variant="headline" numberOfLines={1}>{tournament.name}</Text>
                               <Text variant="subheadline" color="secondaryLabel" numberOfLines={1}>{tournament.game}</Text>
                               <Text variant="caption" color="secondaryLabel" style={{ marginTop: 4 }}>{dateStr}</Text>
                            </View>
                         </Pressable>
                      );
                    })}
                 </View>
              );
            })()}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent, borderRadius: radii.button, bottom: Platform.OS === 'ios' ? 100 : 80, right: 24 }, shadows.floating]}
        onPress={() => router.push('/tournament/create' as any)}
      >
        <SymbolView name="plus" tintColor={colors.background} size={24} weight="bold" />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: 280,
    overflow: 'hidden',
  },
  badgeRow: {
    position: 'absolute',
    top: 110,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});
