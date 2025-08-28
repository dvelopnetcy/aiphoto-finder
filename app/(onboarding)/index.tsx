// File: app/(onboarding)/index.tsx (UI Restored)

import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { spacing, typography } from '@/constants/Theme';

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Icon name="Search" size={60} color={theme.primary} />
      <Text style={[styles.title, { color: theme.text }]}>Find Any Memory Instantly</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Works offline. 100% private. Your photos never leave your device.
      </Text>
      <View style={styles.spacer} />
      <Button title="Get Started" onPress={() => router.push('/analyze')} />
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