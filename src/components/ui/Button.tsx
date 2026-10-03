import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/tokens';
import { Text } from './Text';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  variant = 'primary',
  loading = false,
  style,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors, radii, spacing } = useTheme();
  const scale = useSharedValue(1);

  const getBackgroundColor = () => {
    if (disabled) return colors.separator;
    switch (variant) {
      case 'primary':
        return colors.accent;
      case 'secondary':
        return colors.tintBg;
      case 'destructive':
        return colors.tintBg;
      default:
        return colors.accent;
    }
  };

  const getTextColor = () => {
    if (disabled) return 'secondaryLabel';
    switch (variant) {
      case 'primary':
        return 'background';
      case 'secondary':
        return 'accent';
      case 'destructive':
        return 'destructive';
      default:
        return 'background';
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 200 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!loading && !disabled) {
      onPress?.(e);
    }
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: radii.button,
          minHeight: 44,
          paddingHorizontal: spacing.m,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={label}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors[getTextColor() as keyof typeof colors]} />
      ) : (
        <Text variant="headline" color={getTextColor() as any} align="center">
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
