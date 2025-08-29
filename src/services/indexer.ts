// src/services/indexer.ts
import * as MediaLibrary from 'expo-media-library';
import { aiService } from '@/services/aiService';

export type ProgressCb = (done: number, total: number) => void;

/**
 * Τρέχει embeddings στο foreground (χωρίς να περιμένει το OS).
 * Συγχρονισμός 2 workers για να κινείται γρήγορα χωρίς να βαράει τη συσκευή.
 */
export async function runForegroundScan(onProgress?: ProgressCb) {
  // 1) Βεβαιώσου ότι έχουμε άδεια
  const ok = await aiService.ensureMediaPermission();
  if (!ok) throw new Error('Missing media permission');

  // 2) Φόρτωσε το μοντέλο (μία φορά)
  await aiService.loadModel();

  // 3) Φέρε ΟΛΕΣ τις photos (προσαρμόζεις τα όρια αν θες)
  const all: MediaLibrary.Asset[] = [];
  let after: string | undefined;
  do {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: ['photo'],
      first: 1000,
      after,
      sortBy: MediaLibrary.SortBy.modificationTime,
    });
    all.push(...page.assets);
    after = page.endCursor ?? undefined;
    if (!page.hasNextPage) break;
  } while (true);

  const total = all.length;
  let done = 0;
  onProgress?.(done, total);

  // 4) Μικρό pool για concurrency
  const queue = [...all];
  const WORKERS = 2;

  async function worker() {
    while (queue.length) {
      const a = queue.shift()!;
      try {
        await aiService.generateEmbedding(a.uri);
      } catch (e) {
        console.warn('[indexer] embed fail for', a.id, e);
      } finally {
        done += 1;
        onProgress?.(done, total);
      }
    }
  }

  await Promise.all(Array.from({ length: WORKERS }, () => worker()));
}
