// File: src/services/database.ts

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabaseSync('photos.db');
const IS_INITIAL_SCAN_COMPLETE_KEY = 'isInitialScanComplete';

export interface PhotoRecord {
  id: string;
  uri: string;
  created_at: number;
  width: number;
  height: number;
}

type PreparedStatement = ReturnType<typeof db.prepareSync>;

let _initialized = false;
let addPhotoStatement: PreparedStatement | null = null;

export const initDatabase = (): void => {
  db.execSync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY NOT NULL,
      uri TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      embedding_status TEXT NOT NULL DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS embeddings (
      photo_id TEXT PRIMARY KEY NOT NULL,
      vector BLOB NOT NULL,
      model_version TEXT NOT NULL,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(embedding_status);
    CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at);
  `);

  addPhotoStatement = db.prepareSync(
    'INSERT OR REPLACE INTO photos (id, uri, created_at, width, height) VALUES (?, ?, ?, ?, ?)'
  );

  _initialized = true;
};

function ensureInit(): void {
  if (!_initialized) {
    initDatabase();
  }
}

export const addPhoto = (photo: PhotoRecord): void => {
  ensureInit();
  if (!addPhotoStatement) {
    addPhotoStatement = db.prepareSync(
      'INSERT OR REPLACE INTO photos (id, uri, created_at, width, height) VALUES (?, ?, ?, ?, ?)'
    );
  }
  addPhotoStatement.executeSync([
    photo.id,
    photo.uri,
    photo.created_at,
    photo.width,
    photo.height,
  ]);
};

export const getIndexingStatusCounts = async (): Promise<{
  total: number;
  indexed: number;
  scanComplete: boolean;
}> => {
  ensureInit();

  const totalResult = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM photos'
  );
  const indexedResult = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM photos WHERE embedding_status IN ('COMPLETE','FAILED')"
  );
  const scanCompleteValue = await AsyncStorage.getItem(IS_INITIAL_SCAN_COMPLETE_KEY);

  return {
    total: totalResult?.count ?? 0,
    indexed: indexedResult?.count ?? 0,
    scanComplete: scanCompleteValue === 'true',
  };
};

export const getPendingPhotos = (limit: number): PhotoRecord[] => {
  ensureInit();
  return db.getAllSync<PhotoRecord>(
    "SELECT id, uri, created_at, width, height FROM photos WHERE embedding_status = 'PENDING' ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
};

export const addEmbedding = (
  photoId: string,
  vector: number[],
  modelVersion = 'mobilenet_v2_quant'
): void => {
  ensureInit();

  // expo-sqlite για BLOB περιμένει Uint8Array (όχι ArrayBuffer).
  const floats = new Float32Array(vector);
  const blob = new Uint8Array(floats.buffer);

  db.runSync(
    'INSERT OR REPLACE INTO embeddings (photo_id, vector, model_version) VALUES (?, ?, ?)',
    [photoId, blob, modelVersion]
  );
};

export const updatePhotoEmbeddingStatus = (
  photoId: string,
  status: 'PENDING' | 'COMPLETE' | 'FAILED'
): void => {
  ensureInit();
  db.runSync('UPDATE photos SET embedding_status = ? WHERE id = ?', [status, photoId]);
};

export const database = {
  init: initDatabase,
  addPhoto,
  getIndexingStatusCounts,
  getPendingPhotos,
  addEmbedding,
  updatePhotoEmbeddingStatus,
};
