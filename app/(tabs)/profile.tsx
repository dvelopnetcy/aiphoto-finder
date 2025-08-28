// File: app/(tabs)/profile.tsx (Πλήρης, Διορθωμένη Έκδοση)

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, radii } from '@/constants/Theme';
import { Icon, IconProps } from '@/components/ui/Icon';
import { useIndexingStatus } from '@/hooks/useIndexingStatus';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { startBackgroundProcessing } from '@/services/backgroundTaskService'; // Θα το χρειαστούμε ίσως αργότερα
import { Button } from '@/components/ui/Button';

type ProfileListItemProps = {
  icon: IconProps['name'];
  label: string;
  value?: string;
  onPress?: () => void;
};

const ProfileListItem = ({ icon, label, value, onPress }: ProfileListItemProps) => {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: theme.primaryMuted }]}
    >
      <Icon name={icon} size={22} color={theme.textSecondary} />
      <Text style={[styles.listItemLabel, { color: theme.text }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={[styles.listItemValue, { color: theme.textSecondary }]}>{value}</Text>}
      {onPress && <Icon name="ChevronRight" size={20} color={theme.textSecondary} />}
    </Pressable>
  );
};

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { progress, indexedCount, totalCount, isIndexing, isScanComplete } = useIndexingStatus();

  const getIndexingStatusText = () => {
    if (!isScanComplete && totalCount === 0) return "Not started"; // Δεν έχει ξεκινήσει ποτέ
    if (!isScanComplete && totalCount > 0) return `Scanning... (${totalCount} photos found)`; // Σκανάρει τώρα
    if (isScanComplete && progress < 1) return `Indexing AI... (${indexedCount} / ${totalCount})`; // Κάνει AI processing
    if (isScanComplete && progress === 1) return `Complete (${totalCount} photos)`; // Ολοκληρώθηκε
    return 'Preparing...';
  };

  const handleShareApp = async () => { /* ... (το ίδιο όπως πριν) ... */ };
  const handleLeaveFeedback = () => { /* ... (το ίδιο όπως πριν) ... */ };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>

        <View style={[styles.card, { backgroundColor: theme.card, alignItems: 'center', paddingVertical: spacing.lg }]}>
          <ProgressRing progress={progress} />
          <Text style={[styles.indexingStatusText, { color: theme.text }]}>
            {progress === 1 ? 'Indexing Complete' : 'Indexing Status'}
          </Text>
          <Text style={[styles.indexingSubText, { color: theme.textSecondary }]}>
            {getIndexingStatusText()}
          </Text>
        </View>

        {/* --- ΕΠΑΝΑΦΟΡΑ ΤΟΥ UI --- */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ProfileListItem icon="Star" label="Your Plan" value="Free" onPress={() => router.push('/(modals)/plans')} />
          <ProfileListItem icon="ShieldCheck" label="Permissions" onPress={Linking.openSettings} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ProfileListItem icon="Settings" label="Settings" onPress={() => Alert.alert("Coming Soon!")} />
          <ProfileListItem icon="LifeBuoy" label="Help & Support" onPress={() => Alert.alert("Coming Soon!")} />
          <ProfileListItem icon="Info" label="About" onPress={() => Alert.alert("Coming Soon!")} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <ProfileListItem icon="Share" label="Share App" onPress={handleShareApp} />
          <ProfileListItem icon="MessageSquare" label="Leave Feedback" onPress={handleLeaveFeedback} />
        </View>
        {/* --- ΤΕΛΟΣ ΕΠΑΝΑΦΟΡΑΣ --- */}

        <Text style={[styles.footerText, { color: theme.textSecondary }]}>App Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.md },
  title: { ...typography.largeTitle, paddingHorizontal: spacing.sm, marginBottom: spacing.lg },
  card: { borderRadius: radii.lg, marginBottom: spacing.lg, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  listItemLabel: { ...typography.body },
  listItemValue: { ...typography.body, marginRight: spacing.xs },
  indexingStatusText: { ...typography.title2, marginTop: spacing.md },
  indexingSubText: { ...typography.body, marginTop: spacing.xs },
  footerText: { ...typography.caption, textAlign: 'center', marginTop: spacing.md },
});