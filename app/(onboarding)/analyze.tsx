// File: app/(onboarding)/analyze.tsx (The "Start Button")

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '@/hooks/useAppState';
import { startBackgroundProcessing } from '@/services/backgroundTaskService';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/constants/Theme';
import { ProgressRing } from '@/components/ui/ProgressRing'; // Assuming you have a progress ring

export default function AnalyzeScreen() {
  const { theme } = useTheme();
  const { setHasCompletedOnboarding } = useAppState();

  useEffect(() => {
    const analyzeAndComplete = async () => {
      console.log('Onboarding complete. Starting background processing...');
      
      // 1. Kick off the background task
      await startBackgroundProcessing();
      
      // 2. Mark onboarding as complete in async storage
      await AsyncStorage.setItem('onboardingComplete', 'true');
      
      // 3. Update the global state
      setHasCompletedOnboarding(true);

      // 4. Navigate to the main app after a short delay
      setTimeout(() => {
        router.replace('/(tabs)/search');
      }, 1500); // Give the user a moment to see the "complete" state
    };

    analyzeAndComplete();
  }, [setHasCompletedOnboarding]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ProgressRing progress={1} />
      <Text style={[styles.title, { color: theme.text }]}>Setup Complete!</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Your photos will now be indexed in the background. You can start searching right away.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.title1,
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});