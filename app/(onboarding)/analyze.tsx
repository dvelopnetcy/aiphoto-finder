// File: app/(onboarding)/analyze.tsx (Restored to working version)

import { View, Text, StyleSheet, Alert } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/constants/Theme';
import { Button } from '@/components/ui/Button';
import { useAppState } from '@/hooks/useAppState';
import { Icon } from '@/components/ui/Icon';
import { useIndexingStatus } from '@/hooks/useIndexingStatus';

export default function AnalyzeScreen() {
  const { theme } = useTheme();
  const { setHasCompletedOnboarding } = useAppState();
  const { startInitialIndexing } = useIndexingStatus();

  const handleStartAnalyzing = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      startInitialIndexing();
      setHasCompletedOnboarding(true);
      
      // This is the direct navigation command that was working before the errors.
      router.replace('/(tabs)/search');

    } else {
      Alert.alert(
        'Permission Required',
        'AI Photo Finder needs access to your photos. Please enable it in settings.'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Icon name="ShieldCheck" size={80} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>Your Privacy is Our Priority</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          The app needs to scan your photos locally to enable instant search.
        </Text>
        <Text style={[styles.boldSubtitle, { color: theme.text }]}>
          Your photos are never uploaded to the cloud.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button title="Start Analyzing" onPress={handleStartAnalyzing} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: { ...typography.title1, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', lineHeight: 24 },
  boldSubtitle: { ...typography.body, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  footer: { padding: spacing.lg, paddingBottom: spacing.xl },
});