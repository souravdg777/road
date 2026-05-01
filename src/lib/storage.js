import * as SQLite from 'expo-sqlite';
import { getTileCenter } from './spatial';

let db = null;

// 1. Init
export const initDB = async () => {
  if (db) return;
  
  try {
    db = await SQLite.openDatabaseAsync('explorer_v1.db');
    
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      -- Tiles Table
      CREATE TABLE IF NOT EXISTS tiles (
        id TEXT PRIMARY KEY NOT NULL,
        lat REAL,
        lng REAL
      );
      CREATE INDEX IF NOT EXISTS idx_coords ON tiles (lat, lng);

      -- Path Points Table — exact GPS fixes in exploration order
      CREATE TABLE IF NOT EXISTS path_points (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        lat   REAL    NOT NULL,
        lng   REAL    NOT NULL,
        ts    INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_path_ts ON path_points (ts);

      -- Stats Table (Key-Value Store)
      CREATE TABLE IF NOT EXISTS stats (
        key TEXT PRIMARY KEY NOT NULL,
        value REAL
      );
    `);
    
    // Initialize default stats
    await db.runAsync(
      'INSERT OR IGNORE INTO stats (key, value) VALUES (?, ?)', 
      ['total_distance', 0]
    );
    
    console.log("✅ Database initialized (Tiles + Stats)");
  } catch (e) {
    console.error("❌ Database init failed", e);
    throw e;
  }
};

// 2. Save Tile
export const saveTile = async (id) => {
  if (!db) throw new Error("Database not initialized");
  
  const center = getTileCenter(id);
  await db.runAsync(
    'INSERT OR IGNORE INTO tiles (id, lat, lng) VALUES (?, ?, ?)',
    [id, center.latitude, center.longitude]
  );
};

// 3a. Save a raw GPS path point
export const savePathPoint = async (lat, lng) => {
  if (!db) throw new Error("Database not initialized");
  await db.runAsync(
    'INSERT INTO path_points (lat, lng, ts) VALUES (?, ?, ?)',
    [lat, lng, Date.now()]
  );
};

// 3b. Load ALL path points in exploration order (for drawing the trail)
export const getAllPathPoints = async () => {
  if (!db) throw new Error("Database not initialized");
  const rows = await db.getAllAsync(
    'SELECT lat, lng FROM path_points ORDER BY ts ASC'
  );
  return rows.map(r => ({ latitude: r.lat, longitude: r.lng }));
};

// 4. Get Tiles in Bounds
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
  
  return rows;
};

// 4. Stats: Increment Distance
export const incrementDistance = async (meters) => {
  if (!db) return;
  await db.runAsync(
    'UPDATE stats SET value = value + ? WHERE key = ?', 
    [meters, 'total_distance']
  );
};

// 5. Stats: Get All Stats
export const getStats = async () => {
  if (!db) return { total_distance: 0, tile_count: 0 };
  
  const distResult = await db.getFirstAsync(
    'SELECT value FROM stats WHERE key = ?', 
    ['total_distance']
  );
  
  const countResult = await db.getFirstAsync(
    'SELECT COUNT(id) as count FROM tiles'
  );
  
  return {
    total_distance: distResult?.value || 0,
    tile_count: countResult?.count || 0
  };
};