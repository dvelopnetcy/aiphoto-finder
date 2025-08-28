// File: app/_layout.tsx (The App's Main Traffic Cop)

import React, { useEffect } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { AppStateProvider, AppStateContext } from '@/providers/AppStateProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { useAppState } from '@/hooks/useAppState';
import { useRouter } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const { isAppReady } = React.useContext(AppStateContext);
  const { hasCompletedOnboarding } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (isAppReady) {
      // Hide the splash screen once the app is ready
      SplashScreen.hideAsync();
      
      // This is the core navigation logic
      if (hasCompletedOnboarding) {
        // If user is onboarded, send them to the main app
        router.replace('/(tabs)/search');
      } else {
        // If user is not onboarded, send them to the onboarding flow
        router.replace('/(onboarding)');
      }
    }
  }, [isAppReady, hasCompletedOnboarding, router]);

  // If the app is not ready, we render nothing (the splash screen is visible)
  if (!isAppReady) {
    return null;
  }

  // This is the navigator that will switch between the two main sections of your app.
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

  // It's good practice to show the splash screen until fonts are loaded.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!fontsLoaded) {
    return null;
  }

  // The AppStateProvider and ThemeProvider wrap the entire app.
  return (
    <ThemeProvider>
      <AppStateProvider>
        <RootLayout />
      </AppStateProvider>
    </ThemeProvider>
  );
}