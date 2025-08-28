// File: app/(tabs)/recent.tsx

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState } from '@/components/shared/EmptyState';

export default function RecentScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <EmptyState
        icon="Clock"
        title="No Recent Searches"
        message="Your recent searches will appear here for quick access."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});