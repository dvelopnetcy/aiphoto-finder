// File: app/(onboarding)/analyze.tsx (Η Τελική Υβριδική Λύση)

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '@/hooks/useAppState';
import { startBackgroundProcessing } from '@/services/backgroundTaskService';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/constants/Theme';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { indexingService } from '@/services/indexingService';

export default function AnalyzeScreen() {
  const { theme } = useTheme();
  const { setHasCompletedOnboarding } = useAppState();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Preparing...');

  useEffect(() => {
    const startFullAnalysis = async () => {
      // Βήμα 1: Εκτελούμε το ΑΜΕΣΟ, μη-μπλοκάρον σκανάρισμα μεταδεδομένων.
      setStatusText('Scanning photo library...');
      await indexingService.scanAndPreparePhotos(({ scanned, total }) => {
        // Ενημερώνουμε το UI σε πραγματικό χρόνο.
        setProgress(total > 0 ? scanned / total : 0);
      });

      // Βήμα 2: Αφού τελειώσει το σκανάρισμα, ενεργοποιούμε το background task για το AI.
      setStatusText('Setup complete!');
      setProgress(1);
      await startBackgroundProcessing();
      await AsyncStorage.setItem('onboardingComplete', 'true');
      setHasCompletedOnboarding(true);

      // Βήμα 3: Πλοηγούμαστε στην κυρίως εφαρμογή.
      setTimeout(() => {
        router.replace('/(tabs)/search');
      }, 1000);
    };

    startFullAnalysis();
  }, [setHasCompletedOnboarding]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ProgressRing progress={progress} />
      <Text style={[styles.title, { color: theme.text }]}>{statusText}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        This is a one-time process to prepare your library. The app will be ready in a moment.
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