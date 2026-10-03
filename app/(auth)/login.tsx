import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Alert, Pressable, StyleSheet } from 'react-native';
import { Screen, Text, Button, TextField } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { spacing, colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) return;
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        Alert.alert('Error', error.message);
      }
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
        <View style={{ padding: spacing.m, gap: spacing.m, marginTop: spacing.xl }}>

          {/* Back button row */}
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ alignSelf: 'flex-start' }}>
            <View style={[styles.backCircle, { backgroundColor: colors.tintBg }]}>
              <Text variant="headline" style={{ color: colors.label, lineHeight: 24, paddingBottom: 1 }}>‹</Text>
            </View>
          </Pressable>

          <Text variant="largeTitle" style={{ marginBottom: spacing.s }}>
            Log In
          </Text>
          <TextField 
            label="Email" 
            placeholder="hello@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField 
            label="Password" 
            placeholder="Min 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button 
            label="Log In" 
            onPress={handleAuth} 
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
