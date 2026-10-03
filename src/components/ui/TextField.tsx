import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const { colors, spacing, radii, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, { marginBottom: spacing.m }, style as ViewStyle]}>
      {label && (
        <Text
          variant="footnote"
          color="secondaryLabel"
          style={{ marginBottom: spacing.xs, marginLeft: spacing.xs }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          typography.body,
          {
            color: colors.label,
            backgroundColor: colors.background,
            borderColor: error ? colors.destructive : isFocused ? colors.accent : colors.separator,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radii.button,
            paddingHorizontal: spacing.m,
            minHeight: rest.multiline ? 88 : 44,
            paddingTop: rest.multiline ? spacing.m : undefined,
            paddingBottom: rest.multiline ? spacing.m : undefined,
          },
        ]}
        placeholderTextColor={colors.secondaryLabel}
        textAlignVertical={rest.multiline ? 'top' : 'center'}
        onFocus={(e) => {
          setIsFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      />
      {error && (
        <Text
          variant="caption"
          color="destructive"
          style={{ marginTop: spacing.xs, marginLeft: spacing.xs }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    width: '100%',
  },
});
