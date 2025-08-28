// File: src/services/indexingService.ts (Updated Version)

import * as MediaLibrary from 'expo-media-library';
import { database, PhotoRecord } from './database';

// This function is now very fast. It just scans for photos and adds them to the DB as 'PENDING'.
const scanAndPreparePhotos = async () => {
  console.log('Starting initial fast scan of photo library...');
  try {
    const assets = await MediaLibrary.getAssetsAsync({
      mediaType: 'photo',
      first: 100000,
    });

    console.log(`Found ${assets.totalCount} total photos. Adding them to the database as 'PENDING'.`);

    const records: PhotoRecord[] = assets.assets.map((asset) => ({
      id: asset.id,
      uri: asset.uri,
      created_at: asset.creationTime,
      width: asset.width,
      height: asset.height,
    }));

    // Using a transaction would be even faster, but individual adds with a prepared statement are still very fast.
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