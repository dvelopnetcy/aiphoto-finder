// File: app/(tabs)/folders.tsx

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState } from '@/components/shared/EmptyState';

export default function FoldersScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <EmptyState
        icon="Folder"
        title="Folders are Coming Soon"
        message="Create smart folders to automatically organize your photos by people, places, and more."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});