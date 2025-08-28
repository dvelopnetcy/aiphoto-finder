// File: src/services/database.ts (Corrected Types)

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabaseSync('photos.db');
const IS_INITIAL_SCAN_COMPLETE_KEY = 'isInitialScanComplete';

export interface PhotoRecord { id: string; uri: string; created_at: number; width: number; height: number; }
type PreparedStatement = ReturnType<typeof db.prepareSync>;
let addPhotoStatement: PreparedStatement | null = null;

const initDatabase = (): void => { // <-- FIX: Added return type
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY NOT NULL, uri TEXT NOT NULL, created_at INTEGER NOT NULL, width INTEGER, height INTEGER,
      embedding_status TEXT NOT NULL DEFAULT 'PENDING'
    );
    CREATE TABLE IF NOT EXISTS embeddings (
      photo_id TEXT PRIMARY KEY NOT NULL, vector BLOB NOT NULL, model_version TEXT NOT NULL,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    );
  `);
  addPhotoStatement = db.prepareSync('INSERT OR REPLACE INTO photos (id, uri, created_at, width, height) VALUES (?, ?, ?, ?, ?)');
};

const addPhoto = (photo: PhotoRecord): void => { // <-- FIX: Added return type
  if (!addPhotoStatement) { throw new Error("Database not initialized."); }
  addPhotoStatement.executeSync([photo.id, photo.uri, photo.created_at, photo.width, photo.height]);
};

const getIndexingStatusCounts = async (): Promise<{ total: number; indexed: number; scanComplete: boolean }> => {
  const totalResult = db.getFirstSync<{ 'COUNT(*)': number }>('SELECT COUNT(*) FROM photos');
  const indexedResult = db.getFirstSync<{ 'COUNT(*)': number }>("SELECT COUNT(*) FROM photos WHERE embedding_status = 'COMPLETE' OR embedding_status = 'FAILED'");
  const scanCompleteValue = await AsyncStorage.getItem(IS_INITIAL_SCAN_COMPLETE_KEY);
  return {
    total: totalResult ? totalResult['COUNT(*)'] : 0,
    indexed: indexedResult ? indexedResult['COUNT(*)'] : 0,
    scanComplete: scanCompleteValue === 'true',
  };
};

const getPendingPhotos = (limit: number): PhotoRecord[] => {
  return db.getAllSync<PhotoRecord>("SELECT * FROM photos WHERE embedding_status = 'PENDING' ORDER BY created_at DESC LIMIT ?", [limit]);
};

const addEmbedding = (photoId: string, vector: number[], modelVersion = 'mobilenet_v2_quant'): void => { // <-- FIX: Added return type
  const buffer = new Float32Array(vector).buffer;
  db.runSync('INSERT OR REPLACE INTO embeddings (photo_id, vector, model_version) VALUES (?, ?, ?)', [photoId, new Uint8Array(buffer), modelVersion]);
};

const updatePhotoEmbeddingStatus = (photoId: string, status: 'PENDING' | 'COMPLETE' | 'FAILED'): void => { // <-- FIX: Added return type
  db.runSync('UPDATE photos SET embedding_status = ? WHERE id = ?', [status, photoId]);
};

export const database = { init: initDatabase, addPhoto, getIndexingStatusCounts, getPendingPhotos, addEmbedding, updatePhotoEmbeddingStatus };