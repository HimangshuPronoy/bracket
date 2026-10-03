import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/tokens';

export interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

export function Skeleton({ style, width, height, borderRadius }: SkeletonProps) {
  const { colors, radii } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 800 }), withTiming(0.3, { duration: 800 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          backgroundColor: colors.separator,
          width,
          height,
          borderRadius: borderRadius ?? radii.button,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
