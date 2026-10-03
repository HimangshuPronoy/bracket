import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image, Pressable, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Screen, Text, Card, Button } from '../../../src/components/ui';
import { useTheme } from '../../../src/theme/tokens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { WebView } from 'react-native-webview';
import { useTournament } from '../../../src/hooks/useTournaments';
import { useRegistrationForTournament, useCancelRegistration } from '../../../src/hooks/useRegistrations';
import { useAuth } from '../../../src/features/auth/AuthContext';

const { width } = Dimensions.get('window');

export default function TournamentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing, colors, radii } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'Details' | 'Events'>('Details');
  const { user } = useAuth();
  
  const { data: tournament, isLoading } = useTournament(id);
  const { data: registration, isLoading: regLoading } = useRegistrationForTournament(
    user?.id ?? null,
    id ?? null
  );
  const cancelMutation = useCancelRegistration();
  
  const events = tournament?.events || [];
  
  const isRegistered = registration?.status === 'confirmed';
  const isOrganizer = user?.id === tournament?.organizer_id;

  const handleCancelRegistration = () => {
    if (!registration || !user) return;
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to withdraw from this tournament?',
      [
        { text: 'Keep Registration', style: 'cancel' },
        {
          text: 'Cancel Registration',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync({
                registrationId: registration.id,
                userId: user.id,
                tournamentId: tournament!.id,
              });
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading || regLoading) {
    return (
      <Screen backgroundColor="backgroundGrouped" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }

  if (!tournament) {
    return (
      <Screen backgroundColor="backgroundGrouped">
        <Text style={{ margin: spacing.xl }}>{t('tournament.notFound')}</Text>
      </Screen>
    );
  }

  const InfoPill = ({ emoji, label, value, highlight }: { emoji: string; label: string; value: string; highlight?: string }) => (
    <View style={[styles.infoPill, { backgroundColor: colors.background }]}>
      <Text variant="caption" color="secondaryLabel">{emoji} {label}</Text>
      <Text variant="footnote" style={{ fontWeight: '700', color: highlight ?? colors.label }}>{value}</Text>
    </View>
  );

  return (
    <Screen backgroundColor="backgroundGrouped">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Hero Image with back button */}
        <View style={{ position: 'relative' }}>
          {tournament.banner_url ? (
            <Image
              source={{ uri: tournament.banner_url }}
              style={{ width: '100%', height: 220 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: '100%', height: 220, backgroundColor: colors.separator, justifyContent: 'center', alignItems: 'center' }}>
              <Text variant="headline" color="secondaryLabel">No Banner</Text>
            </View>
          )}

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <BlurView intensity={60} tint="light" style={styles.backBlur}>
              <Text variant="headline" style={{ color: '#111', lineHeight: 24, paddingBottom: 1 }}>‹</Text>
            </BlurView>
          </Pressable>

          {/* Online / In-person badge */}
          <View style={[styles.heroBadge, { top: 16, right: 16 }]}>
            {tournament.is_online ? (
              <View style={[styles.pill, { backgroundColor: 'rgba(41,204,122,0.9)' }]}>
                <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>🌐 Online Event</Text>
              </View>
            ) : (
              <View style={[styles.pill, { backgroundColor: 'rgba(255,113,67,0.9)' }]}>
                <Text variant="caption" style={{ color: '#fff', fontWeight: '700' }}>📍 In-Person Event</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ padding: spacing.m, gap: spacing.l }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', gap: spacing.m, alignItems: 'flex-start' }}>
            {tournament.thumbnail_url && (
              <Image 
                source={{ uri: tournament.thumbnail_url }} 
                style={{ width: 80, height: 80, borderRadius: radii.card, backgroundColor: colors.separator }} 
              />
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.xs, flexWrap: 'wrap' }}>
                {tournament.tags?.map(tag => (
                  <View key={tag} style={{ backgroundColor: colors.tintBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.capsule }}>
                    <Text variant="caption" color="accentSecondary">{t(`tags.${tag.toLowerCase()}`, tag)}</Text>
                  </View>
                ))}
              </View>
              <Text variant="largeTitle">{tournament.name}</Text>
            </View>
          </View>

          {/* Registration CTA / Organizer Tools */}
          {isOrganizer ? (
            <Button
              label="Edit Tournament"
              variant="secondary"
              onPress={() => router.push(`/tournament/${tournament.id}/edit`)}
            />
          ) : isRegistered ? (
            <Card style={[styles.registeredCard, { borderColor: colors.success }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
                <Text variant="headline" style={{ fontSize: 28 }}>✅</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="headline" color="accent">{t('tournament.registered')}</Text>
                  <Text variant="body" color="secondaryLabel" style={{ marginTop: 2 }}>{t('tournament.registeredDesc')}</Text>
                </View>
              </View>
              <Button
                label="Cancel Registration"
                variant="destructive"
                onPress={handleCancelRegistration}
                loading={cancelMutation.isPending}
                style={{ marginTop: spacing.m }}
              />
            </Card>
          ) : (
            <View style={{ gap: spacing.s }}>
              {tournament.registration_fee > 0 && (
                <View style={[styles.feeNotice, { backgroundColor: colors.tintBg, borderRadius: radii.card }]}>
                  <Text variant="subheadline" color="secondaryLabel">
                    💳 Registration requires a <Text variant="subheadline" style={{ fontWeight: '700', color: colors.label }}>${tournament.registration_fee} USD</Text> entry fee per event.
                  </Text>
                </View>
              )}
              <Button
                label={tournament.registration_fee === 0 ? t('tournament.registerNow') + ' — Free' : `${t('tournament.registerNow')} — $${tournament.registration_fee}`}
                onPress={() => router.push(`/tournament/${tournament.id}/register`)}
              />
            </View>
          )}

          {/* Tabs Nav */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.separator, marginBottom: spacing.xs }}>
            <Pressable
              style={[styles.tab, activeTab === 'Details' && [styles.activeTab, { borderBottomColor: colors.accent }]]}
              onPress={() => setActiveTab('Details')}
            >
              <Text variant="headline" color={activeTab === 'Details' ? 'label' : 'secondaryLabel'}>Details</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'Events' && [styles.activeTab, { borderBottomColor: colors.accent }]]}
              onPress={() => setActiveTab('Events')}
            >
              <Text variant="headline" color={activeTab === 'Events' ? 'label' : 'secondaryLabel'}>Events</Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          {activeTab === 'Details' && (
            <View style={{ gap: spacing.l }}>
              {/* Info grid */}
              <View style={styles.infoGrid}>
                <InfoPill emoji="📅" label="Date" value={new Date(tournament.starts_at).toLocaleDateString()} />
                <InfoPill emoji="🎮" label="Game" value={tournament.game} />
                <InfoPill
                  emoji={tournament.is_online ? '🌐' : '📍'}
                  label={tournament.is_online ? 'Location' : 'Venue'}
                  value={tournament.location || 'N/A'}
                />
                {tournament.prize_pool ? (
                  <InfoPill emoji="🏆" label="Prize Pool" value={tournament.prize_pool} highlight={colors.warning} />
                ) : (
                  <InfoPill emoji="🏆" label="Prize Pool" value="No prize" />
                )}
                <InfoPill
                  emoji={tournament.registration_fee === 0 ? '✅' : '💳'}
                  label="Entry Fee"
                  value={tournament.registration_fee === 0 ? 'Free' : `$${tournament.registration_fee} USD`}
                  highlight={tournament.registration_fee === 0 ? colors.success : undefined}
                />
              </View>


              {/* Video Embed */}
              {tournament.video_url && (
                <View style={[styles.videoContainer, { backgroundColor: '#000', borderRadius: radii.card, overflow: 'hidden' }]}>
                  <WebView
                    source={{ uri: tournament.video_url }}
                    style={{ flex: 1 }}
                    allowsFullscreenVideo
                    javaScriptEnabled
                    domStorageEnabled
                  />
                </View>
              )}

              {/* Markdown Description */}
              {tournament.description_md && (
                <View style={{ backgroundColor: colors.background, padding: spacing.m, borderRadius: radii.card }}>
                  <Markdown
                    style={{
                      body: { color: colors.label, fontSize: 16, lineHeight: 24, fontFamily: 'System' },
                      heading1: { color: colors.label, fontSize: 28, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
                      heading2: { color: colors.label, fontSize: 22, fontWeight: 'bold', marginBottom: 8, marginTop: 8 },
                      heading3: { color: colors.label, fontSize: 18, fontWeight: 'bold', marginBottom: 6, marginTop: 6 },
                      link: { color: colors.accent },
                      strong: { fontWeight: 'bold', color: colors.label },
                      blockquote: { borderLeftColor: colors.accent, borderLeftWidth: 4, paddingLeft: 10, opacity: 0.8 },
                      bullet_list: { marginTop: 10, marginBottom: 10 },
                      list_item: { marginBottom: 5 },
                    }}
                  >
                    {tournament.description_md}
                  </Markdown>
                </View>
              )}
            </View>
          )}

          {activeTab === 'Events' && (
            <View>
              {events.length === 0 ? (
                <Text color="secondaryLabel" align="center" style={{ marginTop: spacing.xl }}>No events have been created for this tournament yet.</Text>
              ) : (
                events.map((event) => {
                  return (
                    <Card
                      key={event.id}
                      style={[styles.eventCard, (isRegistered || isOrganizer) && { borderColor: colors.accent, borderWidth: 1.5 }]}
                      onPress={isOrganizer
                        ? () => router.push(`/tournament/${tournament.id}/event/${event.id}/manage` as any)
                        : isRegistered
                        ? () => router.push(`/tournament/${tournament.id}/event/${event.id}/bracket`)
                        : undefined
                      }
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text variant="headline">{event.name}</Text>
                          <Text variant="subheadline" color="secondaryLabel">
                            👥 {event.max_entrants ? `Max ${event.max_entrants}` : 'Unlimited'} {t('tournament.entrants')}
                          </Text>
                          {isOrganizer && (
                            <Text variant="caption" color="accent" style={{ marginTop: spacing.xs }}>
                              ⚙ Manage Bracket
                            </Text>
                          )}
                          {isRegistered && !isOrganizer && (
                            <Text variant="caption" color="accent" style={{ marginTop: spacing.xs }}>
                              {t('tournament.viewBracket')}
                            </Text>
                          )}
                        </View>
                      </View>
                    </Card>
                  );
                })
              )}
            </View>
          )}

        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoGrid: {
    gap: 10,
  },
  infoPill: {
    padding: 14,
    borderRadius: 16,
    gap: 4,
  },
  heroBadge: {
    position: 'absolute',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  registeredCard: {
    borderWidth: 1.5,
  },
  feeNotice: {
    padding: 14,
  },
  eventCard: {
    marginBottom: 8,
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
  },
  backBlur: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
  },
  videoContainer: {
    width: '100%',
    height: width * 0.5625, // 16:9 aspect ratio
    overflow: 'hidden',
  },
});
