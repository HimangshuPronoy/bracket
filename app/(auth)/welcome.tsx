import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Text, Button, Screen } from '../../src/components/ui';
import { useTheme } from '../../src/theme/tokens';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { spacing, colors, radii, isDark } = useTheme();
  const router = useRouter();

  // Floating animation for the trophy
  const floatValue = useSharedValue(0);
  
  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value }]
  }));

  return (
    <Screen backgroundColor="background" style={styles.container}>
      <View style={[styles.content, { padding: spacing.xl }]}>
        <View style={styles.heroSection}>
          <Animated.View 
            entering={FadeInDown.duration(800).springify()}
            style={[styles.iconContainer, floatingStyle]}
          >
            <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.tintBg : colors.label }]}>
              <SymbolView name="trophy.fill" tintColor={isDark ? colors.label : colors.background} size={48} />
            </View>
          </Animated.View>

          <Animated.Text 
            entering={FadeInDown.delay(200).duration(800).springify()}
            style={[styles.title, { color: colors.label }]}
          >
            Bracket
          </Animated.Text>
          
          <Animated.Text 
            entering={FadeInDown.delay(300).duration(800).springify()}
            style={[styles.subtitle, { color: colors.secondaryLabel }]}
          >
            The ultimate platform for organizing, playing, and conquering tournaments.
          </Animated.Text>
        </View>
        
        <Animated.View 
          entering={FadeInUp.delay(500).duration(800).springify()}
          style={{ gap: spacing.m, width: '100%', marginBottom: spacing.xxl }}
        >
          <Button 
            label="Get Started" 
            onPress={() => router.push('/(auth)/sign-up')}
            style={styles.primaryButton}
          />
          <Button 
            label="Log In to Existing Account" 
            variant="secondary"
            onPress={() => router.push('/(auth)/login')}
            style={styles.secondaryButton}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 0,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  }
});
