import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackVisible: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-up" options={{ headerShown: true, title: 'Sign Up', presentation: 'modal' }} />
      <Stack.Screen name="setup-profile" options={{ headerShown: true, title: 'Profile Setup', gestureEnabled: false }} />
    </Stack>
  );
}
