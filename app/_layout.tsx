// File: app/_layout.tsx (final)

// ⚠️ ΣΗΜΕΙΩΣΗ: ΔΕΝ βάζουμε εδώ τα
// import 'react-native-gesture-handler'
// import 'react-native-reanimated'
// Τα έχουμε μόνο στο app/entry.js

import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { AppStateProvider, AppStateContext } from '@/providers/AppStateProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { useAppState } from '@/hooks/useAppState';
import { loadFlags } from '@/services/featureFlags';
import { NativeModules } from 'react-native';

// Κρατάμε το splash μέχρι να φορτώσουν τα assets
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const { isAppReady } = React.useContext(AppStateContext);
  const { hasCompletedOnboarding } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();

      if (hasCompletedOnboarding) {
        router.replace('/(tabs)/search');
      } else {
        router.replace('/(onboarding)');
      }
    }
  }, [isAppReady, hasCompletedOnboarding, router]);

  if (!isAppReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function App() {
  const [fontsLoaded, error] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  // Feature flags
  useEffect(() => {
    loadFlags();
  }, []);

  // Μικρό debug για βεβαιότητα ότι υπάρχει το native Reanimated
  useEffect(() => {
    // Πρέπει να εκτυπώσει true
    console.log('Has NativeReanimated:', !!NativeModules.NativeReanimated);
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AppStateProvider>
        <RootLayout />
      </AppStateProvider>
    </ThemeProvider>
  );
}
