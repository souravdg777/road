import * as SQLite from 'expo-sqlite';
import { getTileCenter } from './spatial';

let db = null;

// 1. Explicit Init (Must be called in App.js)
export const initDB = async () => {
  if (db) return; // Prevent double init
  
  try {
    db = await SQLite.openDatabaseAsync('explorer_v1.db');
    
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS tiles (
        id TEXT PRIMARY KEY NOT NULL,
        lat REAL,
        lng REAL
      );
      CREATE INDEX IF NOT EXISTS idx_coords ON tiles (lat, lng);
    `);
    
    console.log("✅ Database initialized");
  } catch (e) {
    console.error("❌ Database init failed", e);
    throw e; // Crash early if DB fails to init
  }
};

// 2. Minimal Save (Only ID + Center)
export const saveTile = async (id) => {
  if (!db) throw new Error("Database not initialized");
  
  const center = getTileCenter(id);
  await db.runAsync(
    'INSERT OR IGNORE INTO tiles (id, lat, lng) VALUES (?, ?, ?)',
    [id, center.latitude, center.longitude]
  );
};

// 3. Direct Return (No Callbacks)
export const getTilesInBounds = async (bounds) => {
  if (!db) throw new Error("Database not initialized");
  
  const latPad = Math.abs(bounds.northEast.latitude - bounds.southWest.latitude) * 0.3;
  const lngPad = Math.abs(bounds.northEast.longitude - bounds.southWest.longitude) * 0.3;

  const minLat = bounds.southWest.latitude - latPad;
  const maxLat = bounds.northEast.latitude + latPad;
  const minLng = bounds.southWest.longitude - lngPad;
  const maxLng = bounds.northEast.longitude + lngPad;

  const rows = await db.getAllAsync(
    'SELECT id FROM tiles WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?',
    [minLat, maxLat, minLng, maxLng]
  );
  
  return rows; // Return data directly
};