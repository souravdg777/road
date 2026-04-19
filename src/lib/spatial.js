import { H3_RESOLUTION } from './config';

// Mock H3 Resolution to Grid Size (approx meters)
// Res 11 (~25m) -> approx 0.0002 degrees
const GRID_SIZE = 0.0002; 

export const getTileId = (lat, lon) => {
  // Create a unique ID based on rounded coordinates (Simple Geohash style)
  const latId = Math.floor(lat / GRID_SIZE);
  const lonId = Math.floor(lon / GRID_SIZE);
  return `${latId},${lonId}`;
};

export const getTileCenter = (tileId) => {
  // Convert ID back to coordinates
  const [latId, lonId] = tileId.split(',').map(Number);
  const lat = (latId * GRID_SIZE) + (GRID_SIZE / 2);
  const lon = (lonId * GRID_SIZE) + (GRID_SIZE / 2);
  return { latitude: lat, longitude: lon };
};

export const getTilePolygon = (tileId) => {
  // Generate 4 corners of the square for the map overlay
  const center = getTileCenter(tileId);
  const halfSize = GRID_SIZE / 2;
  
  return [
    [center.latitude - halfSize, center.longitude - halfSize],
    [center.latitude - halfSize, center.longitude + halfSize],
    [center.latitude + halfSize, center.longitude + halfSize],
    [center.latitude + halfSize, center.longitude - halfSize],
  ];
};