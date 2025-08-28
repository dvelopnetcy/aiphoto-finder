// File: src/components/ui/Banner.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { radii, spacing, typography } from '@/constants/Theme';
import { Icon, IconProps } from './Icon';

interface BannerProps {
  message: string;
  visible: boolean;
  icon?: IconProps['name'];
}

export const Banner = ({ message, visible, icon = 'Info' }: BannerProps) => {
  const { theme } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { backgroundColor: theme.primaryMuted }]}
    >
      <Icon name={icon} size={20} color={theme.primary} />
      <Text style={[styles.text, { color: theme.primary }]}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  text: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
});