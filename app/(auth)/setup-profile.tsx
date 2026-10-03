import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Screen, Text, Button, TextField } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { useAuth } from '../../src/features/auth/AuthContext';
import { createProfile, isHandleAvailable } from '../../src/lib/services/auth.service';

export default function SetupProfileScreen() {
  const { spacing } = useTheme();
  const { user, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    const trimmedHandle = handle.trim().toLowerCase();

    if (!trimmedName || !trimmedHandle || !user) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!/^[a-z0-9_]{2,24}$/.test(trimmedHandle)) {
      Alert.alert('Invalid handle', 'Handles must be 2–24 characters (letters, numbers, underscores).');
      return;
    }

    setLoading(true);
    try {
      const available = await isHandleAvailable(trimmedHandle);
      if (!available) {
        Alert.alert('Handle taken', 'That handle is already in use. Please choose another.');
        return;
      }

      await createProfile({
        userId: user.id,
        displayName: trimmedName,
        handle: trimmedHandle,
      });

      // Refresh AuthContext so the root layout can redirect to tabs
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen backgroundColor="backgroundGrouped">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ padding: spacing.m, gap: spacing.m, marginTop: spacing.m }}>
          <Text variant="largeTitle" style={{ marginBottom: spacing.xs }}>
            Set Up Profile
          </Text>
          <Text variant="body" color="secondaryLabel" style={{ marginBottom: spacing.m }}>
            Choose a display name and a unique handle to start joining tournaments.
          </Text>
          <TextField
            label="Display Name"
            placeholder="e.g. Justin Wong"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextField
            label="Handle"
            placeholder="e.g. jwong"
            autoCapitalize="none"
            autoCorrect={false}
            value={handle}
            onChangeText={(t) => setHandle(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          />
          <Button
            label="Complete Setup"
            onPress={handleSave}
            loading={loading}
            style={{ marginTop: spacing.m }}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
