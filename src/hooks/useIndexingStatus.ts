// File: src/hooks/useIndexingStatus.ts

import { create } from 'zustand';

interface IndexingState {
  isIndexing: boolean;
  indexedCount: number;
  totalCount: number;
  progress: number; // 0 to 1
  startInitialIndexing: () => void;
  updateProgress: (indexed: number, total: number) => void;
}

// We import the service here to keep the UI separate from the logic
import { indexingService } from '@/services/indexingService';

export const useIndexingStatus = create<IndexingState>((set, get) => ({
  isIndexing: false,
  indexedCount: 0,
  totalCount: 0,
  progress: 0,
  updateProgress: (indexed, total) => {
    set({
      indexedCount: indexed,
      totalCount: total,
      progress: total > 0 ? indexed / total : 0,
    });
  },
  startInitialIndexing: async () => {
    if (get().isIndexing || get().totalCount > 0) return; // Don't re-index if already started or done

    set({ isIndexing: true });
    await indexingService.startIndexing(({ indexed, total }) => {
      get().updateProgress(indexed, total);
    });
    set({ isIndexing: false });
  },
}));