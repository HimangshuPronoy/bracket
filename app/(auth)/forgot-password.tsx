import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Alert, Pressable, StyleSheet } from 'react-native';
import { Screen, Text, Button, TextField } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ForgotPasswordScreen() {
  const { spacing, colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || '');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Email Sent',
          `We've sent a password reset link to ${email.trim()}. Please check your inbox and spam folder.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to send reset email';
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
            Reset Password
          </Text>
          <Text variant="subheadline" style={{ color: colors.secondaryLabel, marginBottom: spacing.s }}>
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </Text>

          <TextField 
            label="Email" 
            placeholder="hello@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Button 
            label="Send Reset Link" 
            onPress={handleReset} 
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
