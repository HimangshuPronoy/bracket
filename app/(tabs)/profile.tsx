import React, { useState } from 'react';
import { ScrollView, View, Alert, Appearance } from 'react-native';
import { Screen, ListSection, ListRow, Avatar, Text, Button } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { useAuth } from '../../src/features/auth/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { spacing } = useTheme();
  const { profile, user, refreshProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  
  const [currentTheme, setCurrentTheme] = useState<'system' | 'light' | 'dark'>('system');

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete profile row (cascade will handle registrations/rankings via DB)
              if (user?.id) {
                await supabase.from('profiles').delete().eq('id', user.id);
              }
              await supabase.auth.signOut();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const LANGUAGES = [
    { label: 'English',           code: 'en' },
    { label: 'Deutsch',           code: 'de' },
    { label: 'Nederlands',        code: 'nl' },
    { label: 'Español',           code: 'es' },
    { label: 'Русский',           code: 'ru' },
    { label: 'Français',          code: 'fr' },
    { label: '한국어',              code: 'ko' },
    { label: '日本語',              code: 'ja' },
    { label: 'Italiano',          code: 'it' },
    { label: 'Português (PT)',    code: 'pt-PT' },
    { label: 'Português (BR)',    code: 'pt-BR' },
  ];

  const THEMES = [
    { label: 'System', value: 'system' as const },
    { label: 'Light', value: 'light' as const },
    { label: 'Dark', value: 'dark' as const },
  ];

  const handleLanguageChange = () => {
    Alert.alert(
      t('settings.language'),
      t('settings.selectLanguage'),
      [
        ...LANGUAGES.map(lang => ({
          text: lang.label,
          onPress: () => i18n.changeLanguage(lang.code),
        })),
        { text: t('settings.cancelBtn'), style: 'cancel' as const },
      ]
    );
  };

  const handleAppearanceChange = () => {
    Alert.alert(
      t('settings.appearance'),
      'Select theme mode',
      [
        ...THEMES.map(theme => ({
          text: theme.label,
          onPress: () => {
            setCurrentTheme(theme.value);
            Appearance.setColorScheme((theme.value === 'system' ? null : theme.value) as any);
          },
        })),
        { text: t('settings.cancelBtn'), style: 'cancel' as const },
      ]
    );
  };

  const currentLangLabel = LANGUAGES.find(l => l.code === i18n.language)?.label ?? i18n.language;
  const currentThemeLabel = THEMES.find(t => t.value === currentTheme)?.label ?? 'System';

  return (
    <Screen backgroundColor="backgroundGrouped">
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={{ padding: spacing.m }}>

          <View style={{ alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.l }}>
            <Avatar size={80} name={profile?.display_name || user?.email} url={profile?.avatar_url} style={{ marginBottom: spacing.m }} />
            <Text variant="title">{profile?.display_name || 'Anonymous'}</Text>
            <Text variant="body" color="secondaryLabel">@{profile?.handle || 'nohandle'}</Text>
          </View>

          <ListSection title={t('account.title')}>
            <ListRow label={t('account.email')} value={user?.email} />
            <ListRow
              label={t('account.editProfile')}
              showChevron
              isLast
              onPress={() => router.push('/edit-profile' as any)}
            />
          </ListSection>

          <ListSection title={t('settings.title')}>
            <ListRow
              label={t('settings.notifications')}
              showChevron
              onPress={() => Alert.alert('Notifications', 'Push notification settings coming soon.')}
            />
            <ListRow
              label={t('settings.language')}
              value={currentLangLabel}
              onPress={handleLanguageChange}
              showChevron
            />
            <ListRow 
              label={t('settings.appearance')} 
              value={currentThemeLabel} 
              onPress={handleAppearanceChange}
              showChevron 
              isLast 
            />
          </ListSection>

          <View style={{ marginTop: spacing.l }}>
            <Button label={t('settings.signOut')} variant="secondary" onPress={handleSignOut} />
          </View>

          <View style={{ marginTop: spacing.l }}>
            <Button label={t('settings.deleteAccount')} variant="destructive" onPress={handleDeleteAccount} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
