// File: src/services/backgroundTaskService.ts (The Workhorse)

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, PhotoRecord } from './database';
import { aiService } from './aiService';

export const AI_PROCESSING_TASK_NAME = 'ai-photo-processing-task';
const IS_INITIAL_SCAN_COMPLETE_KEY = 'isInitialScanComplete';
const AI_BATCH_SIZE = 25;

TaskManager.defineTask(AI_PROCESSING_TASK_NAME, async () => {
  console.log('--- Background Task Started ---');
  try {
    // Phase 1: Perform the initial, one-time metadata scan if it hasn't been done.
    const isScanComplete = await AsyncStorage.getItem(IS_INITIAL_SCAN_COMPLETE_KEY);
    if (isScanComplete !== 'true') {
      console.log('Performing initial metadata scan...');
      const assets = await MediaLibrary.getAssetsAsync({ mediaType: 'photo', first: 100000 });
      const records: PhotoRecord[] = assets.assets.map((asset) => ({
        id: asset.id, uri: asset.uri, created_at: asset.creationTime, width: asset.width, height: asset.height,
      }));
      for (const record of records) { database.addPhoto(record); }
      await AsyncStorage.setItem(IS_INITIAL_SCAN_COMPLETE_KEY, 'true');
      console.log('Initial metadata scan complete.');
    }

    // Phase 2: Process a batch of photos for AI embeddings.
    console.log('Checking for photos to process with AI...');
    await aiService.loadModel();
    const pendingPhotos = database.getPendingPhotos(AI_BATCH_SIZE);

    if (pendingPhotos.length === 0) {
      console.log('No pending photos to process. Task finishing.');
      await unregisterTaskAsync();
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log(`Processing ${pendingPhotos.length} photos in this batch.`);
    for (const photo of pendingPhotos) {
      try {
        const embedding = await aiService.generateEmbedding(photo.uri);
        database.addEmbedding(photo.id, embedding);
        database.updatePhotoEmbeddingStatus(photo.id, 'COMPLETE');
      } catch (error) {
        database.updatePhotoEmbeddingStatus(photo.id, 'FAILED');
      }
    }
    
    console.log('--- Background Task Finished Batch ---');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('A critical error occurred in the background task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const startBackgroundProcessing = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(AI_PROCESSING_TASK_NAME, {
      minimumInterval: 5 * 60, // 5 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background task registered. It will run shortly.');
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
};

export const unregisterTaskAsync = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(AI_PROCESSING_TASK_NAME);
    console.log('Background processing task unregistered.');
  } catch (error) {
    console.error('Failed to unregister background task:', error);
  }
};