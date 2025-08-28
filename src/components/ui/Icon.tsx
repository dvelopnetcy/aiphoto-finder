// File: src/components/ui/Icon.tsx (Corrected)

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
// --- THIS IS THE FIX ---
// We import 'AlertCircle' directly so we can use it as a component without any type errors.
import { icons as lucideIcons, LucideProps, AlertCircle } from 'lucide-react-native';
// --- END OF FIX ---

export interface IconProps {
  name: keyof typeof lucideIcons;
  color?: string;
  size?: number;
}

export const Icon = ({ name, color, size = 24 }: IconProps) => {
  const { theme } = useTheme();

  const LucideIconComponent = lucideIcons[name] as React.FC<LucideProps>;

  if (!LucideIconComponent) {
    // We now render the directly imported AlertCircle component as a fallback.
    // This is type-safe and guaranteed to work.
    return <AlertCircle color={theme.destructive} size={size} />;
  }

  return <LucideIconComponent color={color || theme.text} size={size} />;
};