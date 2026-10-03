import React from 'react';
import { View, StyleSheet, ViewProps, Pressable } from 'react-native';
import { useTheme } from '../../theme/tokens';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({ children, style, onPress, ...rest }: CardProps) {
  const { colors, radii, shadows, spacing } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderRadius: radii.card,
          padding: spacing.m,
        },
        shadows.sm,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});
