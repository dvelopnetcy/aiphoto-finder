// File: src/hooks/useIndexingStatus.ts (Hardened, same behavior)

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { database } from '@/services/database';

type StatusState = { total: number; indexed: number; scanComplete: boolean };

export function useIndexingStatus(pollMs = 3000) {
  const [state, setState] = useState<StatusState>({ total: 0, indexed: 0, scanComplete: false });

  const mounted = useRef(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return; // avoid overlapping calls
    inFlight.current = true;
    try {
      const res = await database.getIndexingStatusCounts();
      if (mounted.current) setState(res);
    } catch {
      // swallow — UI shouldn't crash if DB read fails momentarily
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();

    const interval = setInterval(refresh, pollMs);
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') refresh();
    });

    return () => {
      mounted.current = false;
      clearInterval(interval);
      sub.remove();
    };
  }, [refresh, pollMs]);

  const { total, indexed, scanComplete } = state;
  const progress = total > 0 ? indexed / total : 0;
  const isIndexing = !scanComplete || progress < 1;

  return {
    progress,
    indexedCount: indexed,
    totalCount: total,
    isIndexing,
    isScanComplete: scanComplete,
    refresh, // optional manual trigger
  };
}
