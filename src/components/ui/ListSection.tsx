import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { Text } from './Text';

export interface ListSectionProps extends ViewProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

export function ListSection({ title, footer, children, style, ...rest }: ListSectionProps) {
  const { colors, spacing, radii } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing.l }, style]} {...rest}>
      {title && (
        <Text
          variant="footnote"
          color="secondaryLabel"
          style={{
            marginLeft: spacing.m,
            marginBottom: spacing.s,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
      )}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background,
            borderRadius: 12, // Standard iOS grouped list corner radius
          },
        ]}
      >
        {children}
      </View>
      {footer && (
        <Text
          variant="caption"
          color="secondaryLabel"
          style={{ marginTop: spacing.s, marginLeft: spacing.m, marginRight: spacing.m }}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    overflow: 'hidden',
  },
});
