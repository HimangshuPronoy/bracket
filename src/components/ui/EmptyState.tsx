import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { Text } from './Text';
import { Button } from './Button';
import { SymbolView } from 'expo-symbols';

export interface EmptyStateProps extends ViewProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
  ...rest
}: EmptyStateProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xl }, style]} {...rest}>
      {icon && (
        <SymbolView
          name={icon as any}
          size={48}
          tintColor={colors.secondaryLabel}
          style={{ marginBottom: spacing.m }}
          fallback={<Text variant="largeTitle" color="secondaryLabel">{icon.charAt(0).toUpperCase()}</Text>}
        />
      )}
      <Text variant="title" align="center" style={{ marginBottom: spacing.s }}>
        {title}
      </Text>
      {description && (
        <Text
          variant="body"
          color="secondaryLabel"
          align="center"
          style={{ marginBottom: spacing.xl }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
