import React, { useState } from 'react';
import { ScrollView, View, Alert, Appearance, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Screen, ListSection, ListRow, Avatar, Text, Button } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { useAuth } from '../../src/features/auth/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const { spacing, colors, radii } = useTheme();
  const { profile, user } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  
  const [currentTheme, setCurrentTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

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

  const handleSelectLanguage = async (code: string) => {
    await i18n.changeLanguage(code);
    try {
      await SecureStore.setItemAsync('user_selected_language', code);
    } catch {}
    setShowLanguageModal(false);
  };

  const handleSelectTheme = (value: 'system' | 'light' | 'dark') => {
    setCurrentTheme(value);
    Appearance.setColorScheme((value === 'system' ? null : value) as any);
    setShowThemeModal(false);
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
              onPress={() => setShowLanguageModal(true)}
              showChevron
            />
            <ListRow 
              label={t('settings.appearance')} 
              value={currentThemeLabel} 
              onPress={() => setShowThemeModal(true)}
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

      {/* Language Selection Modal (Fixes Android 3-button limitation) */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.l }}
          onPress={() => setShowLanguageModal(false)}
        >
          <Pressable 
            style={{ 
              width: '100%', maxWidth: 360, maxHeight: 520, 
              backgroundColor: colors.background, 
              borderRadius: radii.card, 
              padding: spacing.l,
              shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10
            }}
            onPress={e => e.stopPropagation()}
          >
            <Text variant="headline" style={{ marginBottom: spacing.m }}>{t('settings.selectLanguage')}</Text>
            
            <ScrollView style={{ maxHeight: 380 }}>
              {LANGUAGES.map((lang, idx) => {
                const isSelected = i18n.language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => handleSelectLanguage(lang.code)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: spacing.m,
                      borderBottomWidth: idx !== LANGUAGES.length - 1 ? 1 : 0,
                      borderBottomColor: colors.separator,
                    }}
                  >
                    <Text variant="body" style={{ fontWeight: isSelected ? '700' : '500', color: isSelected ? colors.accent : colors.label }}>
                      {lang.label}
                    </Text>
                    {isSelected && (
                      <Text variant="body" style={{ color: colors.success, fontWeight: '700' }}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ marginTop: spacing.m }}>
              <Button label={t('settings.cancelBtn')} variant="secondary" onPress={() => setShowLanguageModal(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.l }}
          onPress={() => setShowThemeModal(false)}
        >
          <Pressable 
            style={{ 
              width: '100%', maxWidth: 320, 
              backgroundColor: colors.background, 
              borderRadius: radii.card, 
              padding: spacing.l,
              shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10
            }}
            onPress={e => e.stopPropagation()}
          >
            <Text variant="headline" style={{ marginBottom: spacing.m }}>{t('settings.appearance')}</Text>
            
            {THEMES.map((theme, idx) => {
              const isSelected = currentTheme === theme.value;
              return (
                <TouchableOpacity
                  key={theme.value}
                  onPress={() => handleSelectTheme(theme.value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: spacing.m,
                    borderBottomWidth: idx !== THEMES.length - 1 ? 1 : 0,
                    borderBottomColor: colors.separator,
                  }}
                >
                  <Text variant="body" style={{ fontWeight: isSelected ? '700' : '500', color: isSelected ? colors.accent : colors.label }}>
                    {theme.label}
                  </Text>
                  {isSelected && (
                    <Text variant="body" style={{ color: colors.success, fontWeight: '700' }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <View style={{ marginTop: spacing.m }}>
              <Button label={t('settings.cancelBtn')} variant="secondary" onPress={() => setShowThemeModal(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </Screen>
  );
}
