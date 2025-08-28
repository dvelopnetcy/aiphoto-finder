import { View, StyleSheet, Keyboard } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/Theme';
import { SearchBar } from '@/components/shared/SearchBar';
import { Banner } from '@/components/ui/Banner';
import { PhotoGrid, Photo } from '@/components/shared/PhotoGrid';
import { EmptyState } from '@/components/shared/EmptyState';
import { useIndexingStatus } from '@/hooks/useIndexingStatus';

export default function SearchScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<Photo[]>([]);
  const { isIndexing, progress } = useIndexingStatus();

  const handleSearch = () => {
    Keyboard.dismiss();
    setHasSearched(true);
    setSearchResults([]); 
  };

  const handleVoiceSearch = () => {
    console.log('Voice search triggered');
  };

  const isBannerVisible = isIndexing && progress < 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onVoicePress={handleVoiceSearch}
          onSubmitEditing={handleSearch}
        />
      </View>

      <Banner message={`Indexing in background... (${Math.floor(progress * 100)}%)`} visible={isBannerVisible} />

      <View style={styles.content}>
        {searchResults.length > 0 ? (
          <PhotoGrid photos={searchResults} />
        ) : (
          <>
            {hasSearched ? (
              <EmptyState
                icon="SearchX"
                title="No Results Found"
                message="Try a different search query. Real AI search is coming soon!"
              />
            ) : (
              <EmptyState
                icon="Image"
                title="What are you looking for?"
                message="Search for people, places, things, or even text in your photos."
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
});