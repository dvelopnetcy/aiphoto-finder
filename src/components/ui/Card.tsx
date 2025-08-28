// File: src/components/ui/Card.tsx

import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radii, spacing } from '@/constants/Theme';

interface CardProps extends ViewProps {}

export const Card = ({ children, style, ...props }: CardProps) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          shadowColor: '#000',
          borderColor: theme.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
        borderWidth: 1,
      },
    }),
  },
});