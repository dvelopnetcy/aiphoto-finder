// File: src/hooks/useIndexingStatus.ts (Final Corrected Async Version)

import { useState, useEffect, useCallback } from 'react';
import { database } from '@/services/database';
import { AppState } from 'react-native';

export const useIndexingStatus = () => {
  const [totalCount, setTotalCount] = useState(0);
  const [indexedCount, setIndexedCount] = useState(0);
  const [isScanComplete, setIsScanComplete] = useState(false);

  // We use useCallback to create a stable async function reference.
  const checkStatus = useCallback(async () => {
    try {
      const { total, indexed, scanComplete } = await database.getIndexingStatusCounts();
      setTotalCount(total);
      setIndexedCount(indexed);
      setIsScanComplete(scanComplete);
    } catch (error) {
      console.error("Failed to check indexing status:", error);
    }
  }, []);

  useEffect(() => {
    checkStatus(); // Initial check

    const interval = setInterval(checkStatus, 3000); // Poll every 3 seconds

    // --- THIS IS THE FIX ---
    // The event listener now correctly handles the async checkStatus function.
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log("App has come to the foreground. Re-checking indexing status.");
        checkStatus();
      }
    });
    // --- END OF FIX ---

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkStatus]); // Depend on the stable checkStatus function

  const progress = totalCount > 0 ? indexedCount / totalCount : 0;
  const isIndexing = isScanComplete && progress < 1;

  return { progress, indexedCount, totalCount, isIndexing };
};