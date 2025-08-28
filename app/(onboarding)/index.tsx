// File: app/(onboarding)/index.tsx (Final Path-Corrected Version)

import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { spacing, typography } from '@/constants/Theme';

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* --- THIS IS THE FINAL FIX --- */}
      {/* This is the one, definitively correct relative path. */}
      <Image
        source={require('../../assets/images/welcome-hero.png')}
        style={styles.heroImage}
        resizeMode="contain"
      />
      {/* --- END OF FIX --- */}
      
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
  heroImage: {
    width: '100%',
    height: 300,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title1,
    textAlign: 'center',
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