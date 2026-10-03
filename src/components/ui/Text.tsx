import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../../theme/tokens';

export interface TextProps extends RNTextProps {
  variant?: 'largeTitle' | 'title' | 'headline' | 'body' | 'subheadline' | 'footnote' | 'caption';
  color?: 'label' | 'secondaryLabel' | 'accent' | 'accentSecondary' | 'destructive' | 'success' | 'warning' | 'background';
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'bold' | '600' | '700';
}

export function Text({
  style,
  variant = 'body',
  color = 'label',
  align = 'left',
  weight,
  ...rest
}: TextProps) {
  const { colors, typography } = useTheme();

  const textStyle: StyleProp<TextStyle> = [
    typography[variant],
    {
      color: colors[color as keyof typeof colors] as string,
      textAlign: align,
    },
    weight ? { fontWeight: weight } : null,
    style,
  ];

  return <RNText style={textStyle} allowFontScaling {...rest} />;
}
