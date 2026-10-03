import React, { useState } from 'react';
import {
  View, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image, Pressable
} from 'react-native';
import { Screen, Text, TextField, Button } from '../src/components/ui';
import { useTheme } from '../src/theme/tokens';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/features/auth/AuthContext';
import { updateProfile, uploadAvatar } from '../src/lib/services/auth.service';

export default function EditProfileScreen() {
  const { spacing, colors, radii } = useTheme();
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [handle, setHandle] = useState(profile?.handle ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty.');
      return;
    }
    const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanHandle.length < 3) {
      Alert.alert('Error', 'Handle must be at least 3 characters (letters, numbers, underscores).');
      return;
    }

    setIsSaving(true);
    try {
      let newAvatarUrl = profile?.avatar_url ?? null;
      if (avatarUri) {
        newAvatarUrl = await uploadAvatar(user.id, avatarUri);
      }
      await updateProfile(user.id, {
        display_name: displayName.trim(),
        handle: cleanHandle,
        avatar_url: newAvatarUrl,
      });
      await refreshProfile();
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const avatarSource = avatarUri ?? profile?.avatar_url;

  return (
    <Screen backgroundColor="backgroundGrouped">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View style={{ padding: spacing.m, gap: spacing.l }}>

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tintBg }}
              >
                <Text variant="headline" style={{ color: colors.label, lineHeight: 24, paddingBottom: 1 }}>‹</Text>
              </Pressable>
              <Text variant="headline">Edit Profile</Text>
              <View style={{ width: 38 }} />
            </View>

            {/* Avatar */}
            <View style={{ alignItems: 'center', gap: spacing.m }}>
              <Pressable onPress={handlePickAvatar}>
                {avatarSource ? (
                  <Image
                    source={{ uri: avatarSource }}
                    style={{ width: 96, height: 96, borderRadius: 48 }}
                  />
                ) : (
                  <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.tintBg, alignItems: 'center', justifyContent: 'center' }}>
                    <SymbolView name="person.fill" tintColor={colors.secondaryLabel} size={40} />
                  </View>
                )}
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.accent, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <SymbolView name="camera.fill" tintColor={colors.background} size={12} />
                </View>
              </Pressable>
              <Text variant="caption" color="secondaryLabel">Tap to change photo</Text>
            </View>

            {/* Fields */}
            <View style={{ gap: spacing.m }}>
              <TextField
                label="Display Name"
                placeholder="Your public name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCorrect={false}
              />
              <TextField
                label="Handle"
                placeholder="yourhandle"
                value={handle}
                onChangeText={(text: string) => setHandle(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text variant="caption" color="secondaryLabel">
                Handle can only contain lowercase letters, numbers, and underscores.
              </Text>
            </View>

            <Button
              label={isSaving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
