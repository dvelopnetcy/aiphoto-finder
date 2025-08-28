// File: src/components/shared/EmptyState.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/constants/Theme';
import { Icon, IconProps } from '@/components/ui/Icon';

interface EmptyStateProps {
  icon: IconProps['name'];
  title: string;
  message: string;
}

export const EmptyState = ({ icon, title, message }: EmptyStateProps) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
        <Icon name={icon} size={32} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title2,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    textAlign: 'center',
  },
});