// File: src/hooks/useAppState.ts (Simplified)

import { create } from 'zustand';

interface AppState {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (status: boolean) => void;
}

export const useAppState = create<AppState>((set) => ({
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
}));