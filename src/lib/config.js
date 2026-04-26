export const H3_RESOLUTION = 11; 

// Smoothing Thresholds (Optimized for Walking)
export const MIN_UPDATE_DISTANCE = 10; // jitter filter
export const MIN_UPDATE_TIME = 1000;
export const JUMP_THRESHOLD = 100;

// Rendering
export const MAX_TILES = 2000;
export const ACTIVE_TILE_DURATION = 1000;
export const UNEXPLORED_MAP_STYLE = [
  { featureType: "all", stylers: [{ saturation: -100 }, { lightness: -30 }] }
];

// Fog gradient — white fill opacities layered over the dark map style
// 1 tile from explored edge (inner fog boundary)
export const FOG_EDGE_OPACITY = 0.28;
// 2 tiles from explored edge (outer penumbra)
export const FOG_OUTER_EDGE_OPACITY = 0.10;

// Radius (meters) defining the "home area" for % explored calculation
export const NEIGHBORHOOD_RADIUS_M = 2500;

// ─── Cloud / Fog-of-War rendering (Skia) ─────────────────────────────────────

// Tile blob — the soft circle that punches a hole in the mist per explored tile
export const CLOUD_TILE_BLOB_RADIUS = 18;   // px at default zoom
export const CLOUD_TILE_BLOB_BLUR   = 12;   // px gaussian blur (soft organic edge)

// Bloom — the grow-in animation when a new tile is first unlocked
export const CLOUD_BLOOM_DURATION_MS = 600; // ms (ease-out cubic)

// Mist drift — each of 3 parallax layers oscillates at a different speed
export const CLOUD_DRIFT_LAYER_1_DURATION = 14000; // ms (deepest, slowest)
export const CLOUD_DRIFT_LAYER_2_DURATION = 9000;  // ms (mid)
export const CLOUD_DRIFT_LAYER_3_DURATION = 6000;  // ms (surface, fastest)

// Base mist opacity layered over the dark map style
export const CLOUD_BASE_OPACITY = 0.10;