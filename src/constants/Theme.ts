// File: src/constants/Theme.ts (Updated)

import { Platform } from 'react-native';

const palette = {
  teal: '#008080',
  tealLight: '#E0F2F1',
  destructive: '#FF3B30',
  gold: '#FFCC00',
  white: '#FFFFFF',
  black: '#000000',
  grey90: '#1C1C1E',
  grey80: '#2C2C2E',
  grey70: '#3A3A3C',
  grey30: '#C7C7CC',
  grey10: '#F2F2F7',
};

export const lightTheme = {
  background: palette.grey10,
  card: palette.white,
  text: palette.black,
  textSecondary: palette.grey70,
  primary: palette.teal,
  primaryMuted: palette.tealLight,
  destructive: palette.destructive,
  border: '#E5E5E5',
};

export const darkTheme = {
  background: palette.black,
  card: palette.grey90,
  text: palette.white,
  textSecondary: palette.grey30,
  primary: palette.teal,
  primaryMuted: palette.grey80,
  destructive: palette.destructive,
  border: palette.grey70,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 999,
};

// --- UPDATED SECTION ---
// We now reference our loaded fonts directly for a premium feel.
export const typography = {
  largeTitle: {
    fontSize: 34,
    fontFamily: 'Inter-Bold',
  },
  title1: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  title2: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
  },
  body: {
    fontSize: 17,
    fontFamily: 'Inter-Regular',
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
};