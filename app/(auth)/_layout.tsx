import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackVisible: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="setup-profile" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}
