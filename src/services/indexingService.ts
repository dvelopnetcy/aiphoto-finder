// File: src/services/indexingService.ts (Corrected Version)

import * as MediaLibrary from 'expo-media-library';
import { database, PhotoRecord } from './database';

// This function's only job is to scan photos. It no longer touches the app state.
const scanAndPreparePhotos = async () => {
  console.log('Starting initial FAST & NON-BLOCKING scan of photo library...');
  try {
    const assets = await MediaLibrary.getAssetsAsync({
      mediaType: 'photo',
      first: 100000,
    });

    console.log(`Found ${assets.totalCount} total photos. Adding them to the database.`);

    const records: PhotoRecord[] = assets.assets.map((asset) => ({
      id: asset.id,
      uri: asset.uri,
      created_at: asset.creationTime,
      width: asset.width,
      height: asset.height,
    }));

    for (const record of records) {
      database.addPhoto(record);
    }
    
    console.log('Initial fast scan complete. Photos are ready for background processing.');
    return true;

  } catch (error) {
    console.error('An error occurred during the initial fast scan:', error);
    return false;
  }
};

export const indexingService = {
  scanAndPreparePhotos,
};