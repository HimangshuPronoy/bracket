import React from 'react';
import { View, StyleSheet, Image, ViewProps } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { Text } from './Text';

export interface AvatarProps extends ViewProps {
  url?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ url, name, size = 40, style, ...rest }: AvatarProps) {
  const { colors } = useTheme();

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '?';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.separator,
        },
        style,
      ]}
      {...rest}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text variant="subheadline" weight="bold" color="secondaryLabel">
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
