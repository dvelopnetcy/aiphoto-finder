// File: src/hooks/useIndexingStatus.ts (Final Corrected Version)
import { useState, useEffect, useCallback } from 'react';
import { database } from '@/services/database';
import { AppState } from 'react-native';

export const useIndexingStatus = () => {
  const [totalCount, setTotalCount] = useState(0);
  const [indexedCount, setIndexedCount] = useState(0);
  const [isScanComplete, setIsScanComplete] = useState(false);

  const checkStatus = useCallback(async () => {
    const { total, indexed, scanComplete } = await database.getIndexingStatusCounts();
    setTotalCount(total); setIndexedCount(indexed); setIsScanComplete(scanComplete);
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') { checkStatus(); }
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [checkStatus]);

  const progress = totalCount > 0 ? indexedCount / totalCount : 0;
  const isIndexing = isScanComplete && progress < 1;

  return { progress, indexedCount, totalCount, isIndexing, isScanComplete };
};