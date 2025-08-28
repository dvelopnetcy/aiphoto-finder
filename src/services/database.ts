// File: src/services/database.ts (Final Version with Prioritization)

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('photos.db');

export interface PhotoRecord {
  id: string; // MediaLibrary Asset ID
  uri: string;
  created_at: number;
  width: number;
  height: number;
}

type PreparedStatement = ReturnType<typeof db.prepareSync>;

let addPhotoStatement: PreparedStatement | null = null;

const initDatabase = () => {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY NOT NULL,
      uri TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      description TEXT,
      ocr_text TEXT,
      embedding_status TEXT NOT NULL DEFAULT 'PENDING'
    );
    CREATE TABLE IF NOT EXISTS embeddings (
      photo_id TEXT PRIMARY KEY NOT NULL,
      vector BLOB NOT NULL,
      model_version TEXT NOT NULL,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    );
  `);

  addPhotoStatement = db.prepareSync(
    'INSERT OR REPLACE INTO photos (id, uri, created_at, width, height) VALUES (?, ?, ?, ?, ?)'
  );
};

const addPhoto = (photo: PhotoRecord) => {
  if (!addPhotoStatement) {
    throw new Error("Database is not initialized. Cannot add photo.");
  }
  addPhotoStatement.executeSync([photo.id, photo.uri, photo.created_at, photo.width, photo.height]);
};

const getPhotoCount = (): number => {
  const result = db.getFirstSync<{ 'COUNT(*)': number }>('SELECT COUNT(*) FROM photos');
  return result ? result['COUNT(*)'] : 0;
};

const getIndexingStatusCounts = (): { total: number; indexed: number } => {
  const totalResult = db.getFirstSync<{ 'COUNT(*)': number }>('SELECT COUNT(*) FROM photos');
  const indexedResult = db.getFirstSync<{ 'COUNT(*)': number }>(
    "SELECT COUNT(*) FROM photos WHERE embedding_status = 'COMPLETE' OR embedding_status = 'FAILED'"
  );
  return {
    total: totalResult ? totalResult['COUNT(*)'] : 0,
    indexed: indexedResult ? indexedResult['COUNT(*)'] : 0,
  };
};

// --- THIS IS THE STRATEGIC CHANGE ---
// We now fetch the NEWEST photos first to process them first.
const getPendingPhotos = (limit: number): PhotoRecord[] => {
  const results = db.getAllSync<PhotoRecord>(
    "SELECT * FROM photos WHERE embedding_status = 'PENDING' ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
  return results;
};

const addEmbedding = (photoId: string, vector: number[], modelVersion = 'mobilenet_v2_quant') => {
  const buffer = new Float32Array(vector).buffer;
  const uint8Array = new Uint8Array(buffer);
  db.runSync('INSERT OR REPLACE INTO embeddings (photo_id, vector, model_version) VALUES (?, ?, ?)', [
    photoId,
    uint8Array,
    modelVersion,
  ]);
};

const updatePhotoEmbeddingStatus = (photoId: string, status: 'PENDING' | 'COMPLETE' | 'FAILED') => {
  db.runSync('UPDATE photos SET embedding_status = ? WHERE id = ?', [status, photoId]);
};

const findSimilarPhotos = (queryVector: number[]) => {
  console.log('Searching for similar photos is a V1.2 feature!');
  return [];
};

export const database = {
  init: initDatabase,
  addPhoto,
  getPhotoCount,
  addEmbedding,
  updatePhotoEmbeddingStatus,
  findSimilarPhotos,
  getPendingPhotos,
  getIndexingStatusCounts,
};