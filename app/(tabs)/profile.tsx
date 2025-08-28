// File: app/(tabs)/profile.tsx (The Smart Monitor)

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, radii } from '@/constants/Theme';
import { Icon, IconProps } from '@/components/ui/Icon';
import { useIndexingStatus } from '@/hooks/useIndexingStatus';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { startBackgroundProcessing } from '@/services/backgroundTaskService';
import { Button } from '@/components/ui/Button';

// ... (Your existing ProfileListItem component code remains the same)

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { progress, indexedCount, totalCount, isIndexing, isScanComplete } = useIndexingStatus();

  const getIndexingStatusText = () => {
    if (!isScanComplete) return "Not started";
    if (totalCount > 0 && !isIndexing && progress === 1) return `Complete (${totalCount} photos)`;
    if (isIndexing) return `Indexing... (${indexedCount} / ${totalCount})`;
    return 'Ready to index';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>

        <View style={[styles.card, { backgroundColor: theme.card, alignItems: 'center', paddingVertical: spacing.lg }]}>
          {isScanComplete ? (
            <ProgressRing progress={progress} />
          ) : (
            <Icon name="Database" size={40} color={theme.textSecondary} />
          )}
          <Text style={[styles.indexingStatusText, { color: theme.text }]}>
            {progress === 1 ? 'Indexing Complete' : 'Indexing Status'}
          </Text>
          <Text style={[styles.indexingSubText, { color: theme.textSecondary }]}>
            {getIndexingStatusText()}
          </Text>
          {!isScanComplete && (
             <Button title="Start First-Time Scan" onPress={startBackgroundProcessing} />
          )}
        </View>

        {/* ... (The rest of your ProfileListItem sections remain the same) ... */}

      </ScrollView>
    </SafeAreaView>
  );
}

// ... (Your existing styles StyleSheet code remains the same)

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.md },
  title: {
    ...typography.largeTitle,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  listItemLabel: { ...typography.body },
  listItemValue: { ...typography.body, marginRight: spacing.xs },
  indexingStatusText: {
    ...typography.title2,
    marginTop: spacing.md,
  },
  indexingSubText: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  footerText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});