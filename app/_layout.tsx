import { Stack, useRouter, useSegments, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../src/theme/tokens';
import { AuthProvider, useAuth } from '../src/features/auth/AuthContext';
import { useEffect } from 'react';
import '../src/lib/i18n';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isDark } = useTheme();
  const { session, profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    
    // Allow access to the design gallery without redirecting
    if (segments[0] === 'design') return;

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else if (!profile) {
      if (!(segments as string[]).includes('setup-profile')) {
        router.replace('/(auth)/setup-profile');
      }
    } else {
      const segs: any = segments;
      if (inAuthGroup || segs.length === 0 || segs[0] === 'index') {
        router.replace('/(tabs)/discover');
      }
    }
  }, [session, profile, isLoading, segments]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="design" options={{ title: 'Design Gallery', headerLargeTitle: true, headerShown: true }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
