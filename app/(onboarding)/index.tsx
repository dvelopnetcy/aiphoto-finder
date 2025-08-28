import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/constants/Theme';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const BulletPoint = ({
  text,
  icon,
}: {
  text: string;
  icon: React.ComponentProps<typeof Icon>['name'];
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.bulletPoint}>
      <Icon name={icon} color={theme.primary} size={22} />
      <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );
};

export default function WelcomeScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Image source={require('../../assets/images/welcome-hero.png')} style={styles.heroImage} />
        <Text style={[styles.title, { color: theme.text }]}>Find any memory, instantly.</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          AI Photo Finder works offline, and your photos never leave your device.
        </Text>

        <View style={styles.features}>
          <BulletPoint icon="Zap" text="Smart search with natural language" />
          <BulletPoint icon="WifiOff" text="Works offline, anytime, anywhere" />
          <BulletPoint icon="Lock" text="100% private and on-device" />
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Continue" onPress={() => router.push('/analyze')} /> 
        {/* ✅ not "/(onboarding)/analyze" */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  heroImage: { width: 150, height: 150, marginBottom: spacing.xl },
  title: { ...typography.title1, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { ...typography.body, textAlign: 'center', maxWidth: '90%', marginBottom: spacing.xl },
  features: { gap: spacing.md, width: '100%', alignItems: 'flex-start', paddingLeft: spacing.lg },
  bulletPoint: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bulletText: { ...typography.body },
  footer: { padding: spacing.lg, paddingBottom: spacing.xl },
});
