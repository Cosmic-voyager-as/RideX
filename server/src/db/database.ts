import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

/** OOP: Abstraction
 *  WHY: Establishes a database contract interface so repositories and services depend on an abstraction rather than coupling directly to a concrete SQLite engine. */
export interface IDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
  close(): void;
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(dbPath?: string): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const resolvedPath =
    dbPath ||
    process.env.DATABASE_PATH ||
    path.join(__dirname, '../../ridex.sqlite');

  // Node 24 native high-performance SQLite synchronous engine
  dbInstance = new DatabaseSync(resolvedPath);
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec('PRAGMA journal_mode = WAL;');

  return dbInstance;
}

export function initDatabase(dbPath?: string): DatabaseSync {
  const db = getDatabase(dbPath);
  const candidatePaths = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '../../src/db/schema.sql'),
    path.resolve(process.cwd(), 'src/db/schema.sql'),
    path.resolve(process.cwd(), 'server/src/db/schema.sql')
  ];

  const schemaPath = candidatePaths.find((p) => fs.existsSync(p));

  if (schemaPath) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  } else {
    throw new Error(
      `Schema file not found. Checked candidate paths: ${candidatePaths.join(', ')}`
    );
  }

  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
