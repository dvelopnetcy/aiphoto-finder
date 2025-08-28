// File: src/components/ui/Button.tsx

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radii, spacing, typography } from '@/constants/Theme';
import { Icon, IconProps } from './Icon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  icon?: IconProps['name'];
  disabled?: boolean;
}

export const Button = ({ title, onPress, variant = 'primary', icon, disabled = false }: ButtonProps) => {
  const { theme } = useTheme();

  const variantStyles = {
    primary: {
      backgroundColor: theme.primary,
      textColor: theme.card,
    },
    secondary: {
      backgroundColor: theme.primaryMuted,
      textColor: theme.primary,
    },
    destructive: {
      backgroundColor: theme.destructive,
      textColor: theme.card,
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: currentVariant.backgroundColor },
        (pressed || disabled) && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {icon && <Icon name={icon} color={currentVariant.textColor} size={20} />}
        <Text style={[styles.text, { color: currentVariant.textColor }]}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});