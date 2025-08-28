// File: src/hooks/useAppState.ts

import { create } from 'zustand';

interface AppState {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (status: boolean) => void;
}

export const useAppState = create<AppState>((set) => ({
  hasCompletedOnboarding: false, // Default value
  setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
}));