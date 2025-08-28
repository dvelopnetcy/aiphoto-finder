// File: src/services/backgroundTaskService.ts (New File)

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { database } from './database';
import { aiService } from './aiService';

export const AI_PROCESSING_TASK_NAME = 'ai-photo-processing-task';
const BATCH_SIZE = 25; // Process 25 photos per run to keep it fast and battery-friendly

// This is the function that will be executed by the background task
TaskManager.defineTask(AI_PROCESSING_TASK_NAME, async () => {
  console.log('--- Background Task Started ---');
  try {
    await aiService.loadModel();

    const pendingPhotos = database.getPendingPhotos(BATCH_SIZE);
    if (pendingPhotos.length === 0) {
      console.log('No pending photos to process. Task finishing.');
      await unregisterTaskAsync();
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log(`Found ${pendingPhotos.length} photos to process in this batch.`);

    for (const photo of pendingPhotos) {
      try {
        const embedding = await aiService.generateEmbedding(photo.uri);
        database.addEmbedding(photo.id, embedding);
        database.updatePhotoEmbeddingStatus(photo.id, 'COMPLETE');
        console.log(`Processed photo in background: ${photo.id}`);
      } catch (error) {
        console.error(`Failed to process photo ${photo.id} in background:`, error);
        database.updatePhotoEmbeddingStatus(photo.id, 'FAILED');
      }
    }
    
    console.log('--- Background Task Finished ---');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerTaskAsync = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(AI_PROCESSING_TASK_NAME, {
      minimumInterval: 10 * 60, // run every 10 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background processing task registered successfully.');
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