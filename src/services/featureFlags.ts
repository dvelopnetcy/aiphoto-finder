// src/services/featureFlags.ts
export type FeatureFlags = {
  USE_CLIP_MODEL: boolean;
  ENABLE_VOICE_SEARCH: boolean;
  ENABLE_SMART_FOLDERS: boolean;
};

let flags: FeatureFlags = {
  USE_CLIP_MODEL: false,
  ENABLE_VOICE_SEARCH: false,
  ENABLE_SMART_FOLDERS: false,
};

// Φόρτωσε (ή μελλοντικά sync από remote/AsyncStorage)
export function loadFlags() {
  return flags;
}

export function getFlags(): FeatureFlags {
  return flags;
}

// Συμβατότητα με παλιά import { get as getFlags }
export function get(): FeatureFlags {
  return getFlags();
}

export function setFlags(next: Partial<FeatureFlags>) {
  flags = { ...flags, ...next };
}

export default { loadFlags, getFlags, get, setFlags };
