export const H3_RESOLUTION = 11; 

// Smoothing Thresholds (Optimized for Walking)
export const MIN_UPDATE_DISTANCE = 5; // 5 meters (approx one tile width)
export const MIN_UPDATE_TIME = 2000; // 2 seconds
export const JUMP_THRESHOLD = 100; 

// Rendering
export const MAX_TILES = 2000; 
export const UNEXPLORED_MAP_STYLE = [
  { featureType: "all", stylers: [{ saturation: -100 }, { lightness: -30 }] }
];