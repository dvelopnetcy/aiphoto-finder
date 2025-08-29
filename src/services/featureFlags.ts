// src/services/featureFlags.ts
type FeatureFlags = {
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
  // Placeholder για μελλοντικό remote fetch. Τώρα απλώς επιστρέφουμε τα defaults.
  return flags;
}

export function getFlags(): FeatureFlags {
  return flags;
}

export function setFlags(next: Partial<FeatureFlags>) {
  flags = { ...flags, ...next };
}
