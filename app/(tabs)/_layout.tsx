import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/tokens';
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: Platform.OS === 'ios',
        headerBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={isDark ? 50 : 80} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
          ) : undefined,
        tabBarActiveTintColor: colors.accent,
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          borderRadius: 9999,
          height: 64,
          borderTopWidth: 0,
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={isDark ? 50 : 80} 
            style={{ ...StyleSheet.absoluteFill, borderRadius: 9999, overflow: 'hidden' }} 
            tint={isDark ? 'dark' : 'light'} 
          />
        ),
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color }) => (
            <SymbolView name="magnifyingglass" tintColor={color} fallback={<></>} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{
          title: t('tabs.events'),
          tabBarIcon: ({ color }) => (
            <SymbolView name="calendar" tintColor={color} fallback={<></>} />
          ),
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: t('tabs.rankings'),
          tabBarIcon: ({ color }) => (
            <SymbolView name="trophy" tintColor={color} fallback={<></>} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <SymbolView name="person.crop.circle" tintColor={color} fallback={<></>} />
          ),
        }}
      />
      <Tabs.Screen
        name="organizer"
        options={{
          title: 'Organizer',
          tabBarIcon: ({ color }) => (
            <SymbolView name="chart.bar.fill" tintColor={color} fallback={<></>} />
          ),
        }}
      />
    </Tabs>
  );
}
