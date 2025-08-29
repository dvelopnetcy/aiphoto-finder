// app/(onboarding)/index.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { spacing, typography } from '@/constants/Theme';
import { aiService } from '@/services/aiService';

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const onGetStarted = useCallback(async () => {
    const ok = await aiService.ensureMediaPermission();
    if (!ok) {
      Alert.alert(
        'Permission required',
        'Πήγαινε Settings → Apps → AI Photo Finder (Development) → Permissions → Photos & videos → Allow all.'
      );
      return;
    }
    router.push('/analyze'); // εδώ συνεχίζεις στο screen που κάνει το scan
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Icon name="Search" size={60} color={theme.primary} />
      <Text style={[styles.title, { color: theme.text }]}>Find Any Memory Instantly</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Works offline. 100% private. Your photos never leave your device.
      </Text>
      <View style={styles.spacer} />
      <Button title="Get Started" onPress={onGetStarted} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title1,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: '80%',
  },
  spacer: {
    flex: 1,
  },
});
