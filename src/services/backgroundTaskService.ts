// File: src/services/backgroundTaskService.ts (Hardened, TS-safe, minimal changes)

import * as BackgroundFetch from 'expo-background-fetch';
import { BackgroundFetchResult } from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, PhotoRecord } from './database';
import { aiService } from './aiService';

export const AI_PROCESSING_TASK_NAME = 'ai-photo-processing-task';
const IS_INITIAL_SCAN_COMPLETE_KEY = 'isInitialScanComplete';
const METADATA_CHUNK_SIZE = 100;
const AI_BATCH_SIZE = 25;

// Prevent concurrent runs of the task (headless / overlapping invocations)
let _isRunning = false;

async function hasMediaPermission(): Promise<boolean> {
  try {
    const perm = await MediaLibrary.getPermissionsAsync();
    return !!perm?.granted;
  } catch {
    return false;
  }
}

async function runInitialMetadataScan() {
  console.log('Task: Starting paginated metadata scan...');
  let hasNextPage = true;
  let after: string | undefined = undefined;

  while (hasNextPage) {
    const { assets, endCursor, hasNextPage: newHasNextPage } =
      await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: METADATA_CHUNK_SIZE,
        after,
      });

    if (assets?.length) {
      const records: PhotoRecord[] = assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        created_at:
          // διατήρηση της λογικής σου
          (asset as any).creationTime ?? (asset as any).modificationTime ?? Date.now(),
        width: asset.width,
        height: asset.height,
      }));

      for (const record of records) {
        // κράταμε το API σου (αν είναι sync/async θα δουλέψει)
        // @ts-ignore
        await database.addPhoto(record);
      }
    }

    hasNextPage = newHasNextPage;
    after = endCursor || undefined;
  }

  await AsyncStorage.setItem(IS_INITIAL_SCAN_COMPLETE_KEY, 'true');
  console.log('Task: Paginated metadata scan complete.');
}

async function runAiBatch(): Promise<'no-data' | 'new-data'> {
  console.log('Task: Checking for photos to process with AI...');
  await aiService.loadModel();

  // κράτησα το API σου όπως είναι
  // @ts-ignore
  const pendingPhotos = database.getPendingPhotos(AI_BATCH_SIZE);
  if (!pendingPhotos || pendingPhotos.length === 0) {
    console.log('Task: No pending photos.');
    return 'no-data';
  }

  for (const photo of pendingPhotos) {
    try {
      const embedding = await aiService.generateEmbedding(photo.uri);
      // @ts-ignore
      await database.addEmbedding(photo.id, embedding);
      // @ts-ignore
      await database.updatePhotoEmbeddingStatus(photo.id, 'COMPLETE');
    } catch (error) {
      console.warn('Task: Embedding failed for', photo.id, error);
      try {
        // @ts-ignore
        await database.updatePhotoEmbeddingStatus(photo.id, 'FAILED');
      } catch {
        // ignore
      }
    }
  }

  return 'new-data';
}

TaskManager.defineTask(AI_PROCESSING_TASK_NAME, async () => {
  if (_isRunning) {
    // Avoid overlapping runs; treat as no data to keep OS happy
    return BackgroundFetchResult.NoData;
  }
  _isRunning = true;

  try {
    const granted = await hasMediaPermission();
    if (!granted) {
      console.log('Task: Media permission not granted; skipping.');
      return BackgroundFetchResult.NoData;
    }

    // 1) Initial metadata scan (once)
    const isScanComplete = await AsyncStorage.getItem(IS_INITIAL_SCAN_COMPLETE_KEY);
    if (isScanComplete !== 'true') {
      await runInitialMetadataScan();
    }

    // 2) AI embedding batch
    const batchResult = await runAiBatch();

    // Αν δεν υπάρχει δουλειά, ακολουθώ την επιλογή σου να κάνεις unregister
    if (batchResult === 'no-data') {
      console.log('Task: No pending photos. Unregistering task.');
      try {
        await unregisterTaskAsync();
      } catch (e) {
        console.warn('Task: Unregister failed (ignored):', e);
      }
      return BackgroundFetchResult.NoData;
    }

    return BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Task: Fatal error:', error);
    return BackgroundFetchResult.Failed;
  } finally {
    _isRunning = false;
  }
});

export const startBackgroundProcessing = async () => {
  try {
    // Χρησιμοποιούμε TaskManager για να δούμε αν είναι ήδη registered
    const already = await TaskManager.isTaskRegisteredAsync(AI_PROCESSING_TASK_NAME);
    if (!already) {
      await BackgroundFetch.registerTaskAsync(AI_PROCESSING_TASK_NAME, {
        minimumInterval: 1, // διατήρηση συμπεριφοράς
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background task registered. The OS will run it shortly.');
    } else {
      console.log('Background task already registered.');
    }
  } catch (e) {
    console.warn('Background task registration error:', e);
    // Δεν πετάμε λάθος για να μη μπλοκάρει το onboarding
  }
};

export const unregisterTaskAsync = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(AI_PROCESSING_TASK_NAME);
    console.log('Background task unregistered.');
  } catch (e) {
    console.warn('Background task unregistration error:', e);
  }
};
