// File: src/providers/ThemeProvider.tsx

import React, { createContext, useState, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@/constants/Theme';

type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme?: () => void; // Optional for now
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
  }, [colorScheme]);

  const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  const value = {
    theme,
    isDarkMode,
    // toggleTheme could be implemented here if we add a manual switch
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};