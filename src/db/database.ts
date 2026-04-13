import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from './migrations';

const DB_PATH = path.join(process.cwd(), 'data', 'data.db');

let db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
  }
  return db;
}

/** Override the database instance — used in tests to inject an in-memory DB. */
export function setDb(newDb: Database.Database): void {
  db = newDb;
}
