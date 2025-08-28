// File: src/providers/AppStateProvider.tsx (The Conductor - Simplified)

import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '@/services/database';
import { useAppState } from '@/hooks/useAppState';

interface AppStateContextType {
  isAppReady: boolean;
}

export const AppStateContext = createContext<AppStateContextType>({
  isAppReady: false,
});

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAppReady, setIsAppReady] = useState(false);
  const { setHasCompletedOnboarding } = useAppState();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        database.init();
        console.log('Database initialized.');

        const onboardingStatus = await AsyncStorage.getItem('onboardingComplete');
        if (onboardingStatus === 'true') {
          setHasCompletedOnboarding(true);
          console.log('User has completed onboarding.');
        }
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setIsAppReady(true);
      }
    };
    initializeApp();
  }, [setHasCompletedOnboarding]);

  return (
    <AppStateContext.Provider value={{ isAppReady }}>
      {children}
    </AppStateContext.Provider>
  );
};