// src/services/orchestrator.ts
import { takeNext, complete, fail, enqueue } from './jobQueue';
import * as MediaLibrary from 'expo-media-library';
import { database } from './database';
import { aiService } from './aiService';

export async function seedInitialJobsIfEmpty() {
  // Παράδειγμα: δεν το καλούμε ακόμη — δείχνει πώς θα γεμίσουμε ουρά.
  // const { assets } = await MediaLibrary.getAssetsAsync({ mediaType: 'photo', first: 1000 });
  // for (const a of assets) enqueue('FETCH_METADATA', { id: a.id });
}

export async function processNextBatch(size = 10) {
  const jobs = takeNext(size);
  if (jobs.length === 0) return 'no-data';

  for (const j of jobs) {
    try {
      if (j.type === 'FETCH_METADATA') {
        const asset = await MediaLibrary.getAssetInfoAsync(JSON.parse(j.payload).id);
        database.addPhoto({
          id: asset.id,
          uri: asset.localUri ?? asset.uri,
          created_at: (asset as any).creationTime ?? Date.now(),
          width: asset.width,
          height: asset.height,
        });
        complete(j.id);
      } else if (j.type === 'GENERATE_EMBEDDING') {
        const { id, uri } = JSON.parse(j.payload) as { id: string; uri: string };
        await aiService.loadModel();
        const vec = await aiService.generateEmbedding(uri);
        database.addEmbedding(id, vec);
        database.updatePhotoEmbeddingStatus(id, 'COMPLETE');
        complete(j.id);
      } else {
        complete(j.id); // άγνωστος τύπος — no-op
      }
    } catch (e) {
      console.warn('[orchestrator] job failed', j.id, e);
      fail(j.id);
    }
  }
  return 'new-data';
}
