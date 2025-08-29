// src/services/jobQueue.ts
import * as SQLite from 'expo-sqlite';

type JobType = 'FETCH_METADATA' | 'GENERATE_EMBEDDING' | 'CLUSTER_FACES';

export type JobRow = {
  id: number;
  type: JobType;
  payload: string;    // JSON
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  attempts: number;
  created_at: number;
  updated_at: number;
};

const db = SQLite.openDatabaseSync('photos.db');

let initialized = false;
function ensureInit() {
  if (initialized) return;
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS job_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_jobqueue_status ON job_queue(status);
    CREATE INDEX IF NOT EXISTS idx_jobqueue_type ON job_queue(type);
    CREATE INDEX IF NOT EXISTS idx_jobqueue_updated ON job_queue(updated_at);
  `);
  initialized = true;
}

export function enqueue<T extends Record<string, unknown>>(type: JobType, payload: T) {
  ensureInit();
  const now = Date.now();
  db.runSync(
    'INSERT INTO job_queue (type, payload, status, attempts, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
    [type, JSON.stringify(payload), 'PENDING', now, now]
  );
}

export function takeNext(n: number): JobRow[] {
  ensureInit();
  const rows = db.getAllSync<JobRow>(
    "SELECT * FROM job_queue WHERE status='PENDING' ORDER BY updated_at ASC LIMIT ?",
    [n]
  );
  // mark RUNNING
  const now = Date.now();
  for (const r of rows) {
    db.runSync("UPDATE job_queue SET status='RUNNING', updated_at=? WHERE id=?", [now, r.id]);
  }
  return rows;
}

export function complete(id: number) {
  ensureInit();
  db.runSync("UPDATE job_queue SET status='DONE', updated_at=? WHERE id=?", [Date.now(), id]);
}

export function fail(id: number) {
  ensureInit();
  db.runSync(
    "UPDATE job_queue SET status='FAILED', attempts=attempts+1, updated_at=? WHERE id=?",
    [Date.now(), id]
  );
}
