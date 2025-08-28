// File: app/(onboarding)/analyze.tsx (The User's "Start Button")

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '@/hooks/useAppState';
import { startBackgroundProcessing } from '@/services/backgroundTaskService';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/constants/Theme';
import { Button } from '@/components/ui/Button';

export default function AnalyzeScreen() {
  const { theme } = useTheme();
  const { setHasCompletedOnboarding } = useAppState();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    await startBackgroundProcessing();
    await AsyncStorage.setItem('onboardingComplete', 'true');
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)/search');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Ready to Go!</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Tap below to start the initial indexing. This is a one-time process that runs in the background.
      </Text>
      <View style={styles.spacer} />
      <Button 
        title={isStarting ? "Starting..." : "Start Indexing"} 
        onPress={handleStart}
        disabled={isStarting}
      />
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
  title: { ...typography.title1 },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  spacer: { flex: 1 },
});