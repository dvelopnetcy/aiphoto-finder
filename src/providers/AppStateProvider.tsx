// File: src/providers/AppStateProvider.tsx (Final Merged Version)

import React, { createContext, useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage'; // We'll use this for onboarding status
import { database } from '@/services/database';
import { indexingService } from '@/services/indexingService';
import { registerTaskAsync } from '@/services/backgroundTaskService';
import { useAppState } from '@/hooks/useAppState'; // Your existing hook for Zustand

// This context is useful for other parts of the app to know when core setup is done
interface AppStateContextType {
  isReady: boolean;
  permissionsGranted: boolean;
}

export const AppStateContext = createContext<AppStateContextType>({
  isReady: false,
  permissionsGranted: false,
});

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  // --- MERGED LOGIC ---
  // We bring in your existing hook to set the onboarding state.
  const { setHasCompletedOnboarding } = useAppState();
  // --- END MERGED LOGIC ---

  // This first useEffect handles all the initial, FAST setup tasks.
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize the database
        database.init();
        console.log('Database initialized.');

        // Check for media library permissions
        const { status } = await MediaLibrary.getPermissionsAsync();
        if (status === 'granted') {
          setPermissionsGranted(true);
          console.log('Media library permissions already granted.');
        }

        // --- MERGED LOGIC ---
        // Load the user's onboarding status from storage.
        const onboardingStatus = await AsyncStorage.getItem('onboardingComplete');
        if (onboardingStatus === 'true') {
          setHasCompletedOnboarding(true);
          console.log('User has completed onboarding.');
        }
        // --- END MERGED LOGIC ---

      } catch (e) {
        console.warn('Error during initial app setup:', e);
      } finally {
        // CRITICAL: We tell the app it's ready to render the UI NOW, before any heavy work.
        setIsReady(true);
      }
    };

    initializeApp();
  }, [setHasCompletedOnboarding]); // We add the dependency here

  // This second useEffect runs AFTER the app is ready and permissions are granted.
  // It starts the HEAVY work without blocking the initial render, fixing the ANR error.
  useEffect(() => {
    const startHeavyTasks = async () => {
      console.log('App is rendered, now starting heavy background tasks...');
      
      // Perform the initial fast scan to populate the DB.
      await indexingService.scanAndPreparePhotos();
      
      // Register the background task to start the AI processing marathon.
      await registerTaskAsync();
      
      console.log('Heavy background tasks have been initiated.');
    };

    // We only run this once, when the app is ready and permissions are good to go.
    if (isReady && permissionsGranted) {
      // We use a small timeout to ensure the UI thread is completely free.
      const timer = setTimeout(() => {
        startHeavyTasks();
      }, 100); // 100ms delay is imperceptible to the user.
      
      return () => clearTimeout(timer);
    }
  }, [isReady, permissionsGranted]);

  return (
    <AppStateContext.Provider value={{ isReady, permissionsGranted }}>
      {children}
    </AppStateContext.Provider>
  );
};