// File: src/services/indexingService.ts (Η Τελική, Σωστή Έκδοση)

import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, PhotoRecord } from './database';

const METADATA_CHUNK_SIZE = 100;
const IS_INITIAL_SCAN_COMPLETE_KEY = 'isInitialScanComplete';

/**
 * Εκτελεί το αρχικό, μη-μπλοκάρον σκανάρισμα της βιβλιοθήκης φωτογραφιών.
 * Λειτουργεί σε μικρά κομμάτια (chunks) για να κρατάει το UI γρήγορο.
 * @param onProgress Μια συνάρτηση callback για να στέλνει ζωντανή πρόοδο στο UI.
 */
const scanAndPreparePhotos = async (onProgress: (progress: { scanned: number; total: number }) => void) => {
  console.log('Starting non-blocking initial metadata scan...');
  
  // Παίρνουμε το σύνολο των φωτογραφιών για να ξέρουμε πού βρισκόμαστε.
  const { totalCount } = await MediaLibrary.getAssetsAsync({ mediaType: 'photo', first: 0 });
  onProgress({ scanned: 0, total: totalCount });

  let hasNextPage = true;
  let after: string | undefined = undefined;
  let scannedCount = 0;

  while (hasNextPage) {
    const { assets, endCursor, hasNextPage: newHasNextPage } = await MediaLibrary.getAssetsAsync({
      mediaType: 'photo',
      first: METADATA_CHUNK_SIZE,
      after,
    });
    
    const records: PhotoRecord[] = assets.map((asset) => ({
      id: asset.id, uri: asset.uri, created_at: asset.creationTime, width: asset.width, height: asset.height,
    }));
    
    for (const record of records) {
      database.addPhoto(record);
    }
    
    scannedCount += assets.length;
    onProgress({ scanned: scannedCount, total: totalCount });

    hasNextPage = newHasNextPage;
    after = endCursor;

    // "Αναπνέουμε" για 10ms για να μην παγώσει το UI.
    await new Promise(resolve => setTimeout(resolve, 10)); 
  }

  await AsyncStorage.setItem(IS_INITIAL_SCAN_COMPLETE_KEY, 'true');
  console.log('Initial metadata scan complete.');
};

export const indexingService = {
  scanAndPreparePhotos,
};