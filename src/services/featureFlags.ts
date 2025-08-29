// src/services/featureFlags.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'featureFlags.v1';

// Όλα τα flags εδώ (default = off)
export type FeatureFlags = {
  USE_CLIP_MODEL: boolean;
  ENABLE_VOICE_SEARCH: boolean;
  ENABLE_SMART_FOLDERS: boolean;
};
const defaults: FeatureFlags = {
  USE_CLIP_MODEL: false,
  ENABLE_VOICE_SEARCH: false,
  ENABLE_SMART_FOLDERS: false,
};

// Απλό in-memory cache
let cache: FeatureFlags = { ...defaults };
let loaded = false;

export async function loadFlags(): Promise<FeatureFlags> {
  if (loaded) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) cache = { ...defaults, ...(JSON.parse(raw) as Partial<FeatureFlags>) };
  } catch {
    cache = { ...defaults };
  } finally {
    loaded = true;
  }
  return cache;
}

export function get(): FeatureFlags {
  return cache;
}

export async function set<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) {
  cache = { ...cache, [key]: value };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export async function reset() {
  cache = { ...defaults };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}
