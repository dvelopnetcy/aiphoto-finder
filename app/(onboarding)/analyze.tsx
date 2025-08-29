// File: app/(onboarding)/analyze.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppState } from '@/hooks/useAppState';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/constants/Theme';
import { ProgressRing } from '@/components/ui/ProgressRing';

import { aiService } from '@/services/aiService';
import { indexingService } from '@/services/indexingService';
import { runForegroundScan } from '@/services/indexer';
import { startBackgroundProcessing } from '@/services/backgroundTaskService';

export default function AnalyzeScreen() {
  const { theme } = useTheme();
  const { setHasCompletedOnboarding } = useAppState();

  const [progress, setProgress] = useState(0); // 0..1
  const [statusText, setStatusText] = useState('Preparing...');
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    const startFullAnalysis = async () => {
      try {
        // 0) Ζήτα/επιβεβαίωσε άδεια
        setStatusText('Requesting photo permissions...');
        const ok = await aiService.ensureMediaPermission();
        if (!ok) {
          setStatusText(
            'Permission required. Enable Photos permission from Settings to continue.'
          );
          return;
        }

        // 1) Γρήγορο scan metadata (δείχνουμε ~25% του progress)
        setStatusText('Scanning photo library...');
        await indexingService.scanAndPreparePhotos(({ scanned, total }) => {
          if (!alive.current) return;
          const p = total > 0 ? scanned / total : 0;
          setProgress(0.25 * p);
        });

        // 2) Foreground AI indexing (εμφάνιση πραγματικού progress)
        setStatusText('Indexing photos with AI...');
        await aiService.loadModel();
        await runForegroundScan((done, total) => {
          if (!alive.current) return;
          const p = total > 0 ? done / total : 0;
          // Μετατρέπουμε σε 25%..100%
          setProgress(0.25 + 0.75 * p);
        });

        // 3) Τελείωσε – κρατάμε και background task για μελλοντικά νέα/media
        setStatusText('Finalizing...');
        setProgress(1);
        await startBackgroundProcessing();

        await AsyncStorage.setItem('onboardingComplete', 'true');
        setHasCompletedOnboarding(true);

        setTimeout(() => router.replace('/(tabs)/search'), 500);
      } catch (e) {
        console.warn('[Analyze] failed:', e);
        if (alive.current) {
          setStatusText('Something went wrong. Please try again.');
        }
      }
    };

    startFullAnalysis();

    return () => {
      alive.current = false;
    };
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
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 360,
  },
});
