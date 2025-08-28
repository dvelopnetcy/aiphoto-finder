// File: src/components/shared/PhotoGrid.tsx

import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';

// This is a placeholder type. In a real app, this would come from your database/service layer.
export interface Photo {
  id: string;
  uri: string;
}

interface PhotoGridProps {
  photos: Photo[];
  onEndReached?: () => void;
}

const PhotoGridItem = React.memo(({ item }: { item: Photo }) => {
  const handlePress = () => {
    // Navigate to the photo viewer modal, passing the photo ID
    router.push({ pathname: '/(modals)/photo-viewer', params: { photoId: item.id } });
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.itemContainer, pressed && styles.pressed]}>
      <Image source={{ uri: item.uri }} style={styles.image} />
    </Pressable>
  );
});

export const PhotoGrid = ({ photos, onEndReached }: PhotoGridProps) => {
  return (
    <FlashList
      data={photos}
      renderItem={({ item }) => <PhotoGridItem item={item} />}
      keyExtractor={(item) => item.id}
      numColumns={3}
      estimatedItemSize={130} // Approx width of the device / 3
      contentContainerStyle={styles.listContent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.8}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 2,
  },
  itemContainer: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  image: {
    flex: 1,
    borderRadius: 2, // A slight radius for a softer look
  },
  pressed: {
    opacity: 0.8,
  },
});