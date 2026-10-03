import { useColorScheme } from 'react-native';

export const palette = {
  light: {
    accent: '#111111', // Dark button/icon color
    accentSecondary: '#FF7043', // Orange for streaks/fire
    background: '#FFFFFF',
    backgroundGrouped: '#F7F8FA', // Very light gray for app background
    label: '#121212',
    secondaryLabel: '#8A8A8E',
    separator: '#F0F0F2', // Very subtle borders
    success: '#29CC7A', // Vibrant green
    warning: '#FFB74D',
    destructive: '#FF5252',
    tintBg: '#F2F2F7', // Light gray backgrounds for pills/inactive states
  },
  dark: {
    accent: '#FFFFFF',
    accentSecondary: '#FF8A65',
    background: '#000000',
    backgroundGrouped: '#121212',
    label: '#F5F5F5',
    secondaryLabel: '#A0A0A5',
    separator: '#2C2C2E',
    success: '#32D74B',
    warning: '#FFB74D',
    destructive: '#FF5252',
    tintBg: '#1C1C1E',
  },
};

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

export const radii = {
  button: 9999, // Pill shaped buttons
  card: 24,     // Very rounded cards
  sheet: 32,
  capsule: 9999,
};

export const typography = {
  largeTitle: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  headline: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 16, fontWeight: '500' as const, letterSpacing: -0.2 },
  subheadline: { fontSize: 14, fontWeight: '500' as const, letterSpacing: -0.1 },
  footnote: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0 },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0 },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  }
};

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors: isDark ? palette.dark : palette.light,
    spacing,
    radii,
    typography,
    shadows,
    isDark,
  };
}

export const tokens = {
  colors: palette.light,
  spacing,
  radii,
  typography,
  shadows,
};
