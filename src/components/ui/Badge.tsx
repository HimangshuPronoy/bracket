import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { Text } from './Text';

export interface BadgeProps extends ViewProps {
  label: string;
  status?: 'success' | 'warning' | 'destructive' | 'default';
}

export function Badge({ label, status = 'default', style, ...rest }: BadgeProps) {
  const { colors, spacing, radii } = useTheme();

  const getBackgroundColor = () => {
    switch (status) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'destructive':
        return colors.destructive;
      default:
        return colors.separator; // muted default
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          paddingHorizontal: spacing.s,
          paddingVertical: spacing.xxs,
          borderRadius: radii.capsule,
        },
        style,
      ]}
      {...rest}
    >
      <Text variant="caption" color={status === 'default' ? 'label' : 'background'} weight="bold">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
