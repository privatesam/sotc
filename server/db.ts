import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { mkdirSync } from 'fs';
import { dirname } from 'path';

// Use environment variable for database path or fall back to development path
const databasePath = process.env.DATABASE_URL?.replace('file:', '') || './database.sqlite';

// Ensure the directory exists before creating the database
const dbDir = dirname(databasePath);
mkdirSync(dbDir, { recursive: true });

const sqlite = new Database(databasePath);

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    grid_columns INTEGER NOT NULL DEFAULT 4,
    grid_rows INTEGER NOT NULL DEFAULT 3,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_custom INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS watches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    brand_id INTEGER NOT NULL,
    model TEXT,
    purchase_date TEXT,
    last_serviced TEXT,
    service_period INTEGER NOT NULL DEFAULT 5,
    valuation INTEGER,
    details TEXT,
    history TEXT,
    images TEXT DEFAULT '[]',
    primary_image_index INTEGER DEFAULT 0,
    grid_position INTEGER,
    wear_dates TEXT DEFAULT '[]',
    total_wear_days INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export const db = drizzle({ client: sqlite, schema });
