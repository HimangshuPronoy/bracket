import React from 'react';
import { View, StyleSheet, ViewProps, SafeAreaView } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { StatusBar } from 'expo-status-bar';

export interface ScreenProps extends ViewProps {
  safeArea?: boolean;
  edges?: readonly ('top' | 'right' | 'bottom' | 'left')[];
  backgroundColor?: 'background' | 'backgroundGrouped';
}

export function Screen({
  children,
  style,
  safeArea = true,
  backgroundColor = 'backgroundGrouped',
  ...rest
}: ScreenProps) {
  const { colors, isDark } = useTheme();

  const Container = safeArea ? SafeAreaView : View;

  return (
    <Container
      style={[
        styles.container,
        { backgroundColor: colors[backgroundColor] },
        style,
      ]}
      {...rest}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
