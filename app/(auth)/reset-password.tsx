import React, { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, Alert, Pressable, StyleSheet } from 'react-native';
import { Screen, Text, Button, TextField } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

export default function MobileResetPasswordScreen() {
  const { spacing, colors } = useTheme();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUrl = async (urlStr: string | null) => {
      if (!urlStr) return;
      try {
        const parsed = Linking.parse(urlStr);
        if (parsed.queryParams?.code) {
          await supabase.auth.exchangeCodeForSession(parsed.queryParams.code as string);
        }
      } catch (e) {
        console.error('Error handling deep link:', e);
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  const handleUpdate = async () => {
    if (!password) {
      Alert.alert('Required', 'Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Success',
          'Your password has been reset successfully.',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)/discover') }]
        );
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update password';
      Alert.alert('Error', message);
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
        <View style={{ padding: spacing.m, gap: spacing.m, marginTop: spacing.xl }}>

          {/* Back button row */}
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ alignSelf: 'flex-start' }}>
            <View style={[styles.backCircle, { backgroundColor: colors.tintBg }]}>
              <Text variant="headline" style={{ color: colors.label, lineHeight: 24, paddingBottom: 1 }}>‹</Text>
            </View>
          </Pressable>

          <Text variant="largeTitle" style={{ marginBottom: spacing.xs }}>
            New Password
          </Text>
          <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginBottom: spacing.s }}>
            Enter your new password below.
          </Text>

          <TextField 
            label="New Password" 
            placeholder="Min 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextField 
            label="Confirm Password" 
            placeholder="Repeat new password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Button 
            label="Save New Password" 
            onPress={handleUpdate} 
            loading={loading}
            style={{ marginTop: spacing.m }}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
