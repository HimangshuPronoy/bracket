import React from 'react';
import { View, StyleSheet, Pressable, PressableProps } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { Text } from './Text';

export interface ListRowProps extends PressableProps {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
}

export function ListRow({
  label,
  value,
  icon,
  showChevron,
  isLast = false,
  disabled,
  onPress,
  ...rest
}: ListRowProps) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed && onPress ? colors.tintBg : 'transparent',
          minHeight: 44,
          paddingLeft: spacing.m,
        },
      ]}
      accessibilityRole={onPress ? 'button' : 'none'}
      {...rest}
    >
      <View style={[styles.content, { paddingRight: spacing.m }]}>
        {icon && <View style={[styles.icon, { marginRight: spacing.s }]}>{icon}</View>}
        <Text variant="body" color="label" style={{ flex: 1 }}>
          {label}
        </Text>
        {value && (
          <Text variant="body" color="secondaryLabel">
            {value}
          </Text>
        )}
        {showChevron && (
          <Text variant="body" color="secondaryLabel" style={{ marginLeft: spacing.s }}>
            ›
          </Text>
        )}
      </View>
      {!isLast && (
        <View
          style={[
            styles.separator,
            {
              backgroundColor: colors.separator,
              marginLeft: icon ? 44 : 0, // Roughly align with text
            },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  icon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
