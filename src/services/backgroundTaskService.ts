// File: src/services/backgroundTaskService.ts (Corrected Syntax)

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, PhotoRecord } from './database';
import { aiService } from './aiService';

export const AI_PROCESSING_TASK_NAME = 'ai-photo-processing-task';
const IS_INITIAL_SCAN_COMPLETE_KEY = 'isInitialScanComplete';
const METADATA_CHUNK_SIZE = 100;
const AI_BATCH_SIZE = 25;

TaskManager.defineTask(AI_PROCESSING_TASK_NAME, async () => {
  try {
    const isScanComplete = await AsyncStorage.getItem(IS_INITIAL_SCAN_COMPLETE_KEY);
    if (isScanComplete !== 'true') {
      console.log('Task: Starting paginated metadata scan...');
      let hasNextPage = true;
      let after: string | undefined = undefined;

      while (hasNextPage) {
        const { assets, endCursor, hasNextPage: newHasNextPage } = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: METADATA_CHUNK_SIZE,
          after,
        });
        
        const records: PhotoRecord[] = assets.map((asset) => ({
          id: asset.id, uri: asset.uri, created_at: asset.creationTime, width: asset.width, height: asset.height,
        }));
        for (const record of records) { database.addPhoto(record); }
        
        hasNextPage = newHasNextPage;
        after = endCursor;
      }
      await AsyncStorage.setItem(IS_INITIAL_SCAN_COMPLETE_KEY, 'true');
      console.log('Task: Paginated metadata scan complete.');
    }

    console.log('Task: Checking for photos to process with AI...');
    await aiService.loadModel();
    const pendingPhotos = database.getPendingPhotos(AI_BATCH_SIZE);

    if (pendingPhotos.length === 0) {
      console.log('Task: No pending photos. Unregistering task.');
      await unregisterTaskAsync();
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    for (const photo of pendingPhotos) {
      try {
        const embedding = await aiService.generateEmbedding(photo.uri);
        database.addEmbedding(photo.id, embedding);
        database.updatePhotoEmbeddingStatus(photo.id, 'COMPLETE');
      } catch (error) {
        database.updatePhotoEmbeddingStatus(photo.id, 'FAILED');
      }
    }
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const startBackgroundProcessing = async () => {
  await BackgroundFetch.registerTaskAsync(AI_PROCESSING_TASK_NAME, {
    minimumInterval: 1, stopOnTerminate: false, startOnBoot: true,
  });
  console.log('Background task registered. The OS will run it shortly.');
};

export const unregisterTaskAsync = async () => {
  await BackgroundFetch.unregisterTaskAsync(AI_PROCESSING_TASK_NAME);
};