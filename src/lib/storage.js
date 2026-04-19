import * as FileSystem from 'expo-file-system/legacy';
import { getTileCenter } from './spatial';

const FILE_URI = FileSystem.documentDirectory + 'explored_tiles.json';

// Helper to read file
const readFile = async () => {
  try {
    const content = await FileSystem.readAsStringAsync(FILE_URI);
    return JSON.parse(content);
  } catch (e) {
    // File doesn't exist yet
    return [];
  }
};

// Helper to write file
const writeFile = async (data) => {
  await FileSystem.writeAsStringAsync(FILE_URI, JSON.stringify(data));
};

export const initDB = async () => {
  // Check if file exists, if not create it
  const fileInfo = await FileSystem.getInfoAsync(FILE_URI);
  if (!fileInfo.exists) {
    await writeFile([]);
  }
  return Promise.resolve();
};

export const saveTile = async (h3Id) => {
  try {
    const tiles = await readFile();
    
    // Check if exists
    if (!tiles.find(t => t.id === h3Id)) {
      const center = getTileCenter(h3Id);
      tiles.push({
        id: h3Id,
        lat: center.latitude,
        lng: center.longitude,
        timestamp: Date.now()
      });
      await writeFile(tiles);
    }
  } catch (e) {
    console.error("Error saving tile", e);
  }
};

export const getTilesInBounds = async (bounds, callback) => {
  try {
    const tiles = await readFile();
    callback(tiles);
  } catch (e) {
    console.error("Error loading tiles", e);
    callback([]);
  }
};