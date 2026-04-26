export const H3_RESOLUTION = 11; 

// Smoothing Thresholds (Optimized for Walking)
export const MIN_UPDATE_DISTANCE = 10; // jitter filter
export const MIN_UPDATE_TIME = 1000;
export const JUMP_THRESHOLD = 100;

// Rendering
export const MAX_TILES = 2000;
export const ACTIVE_TILE_DURATION = 1000;
// Dark, desaturated style — gives the "unexplored = fog" feel without an
// overlay layer. Bright tile circles pop visually against this background.
export const UNEXPLORED_MAP_STYLE = [
  { featureType: "all", stylers: [{ saturation: -100 }, { lightness: -65 }] }
];

// ─── Explored Tile Circles (native react-native-maps overlays) ──────────────
// Each explored tile is rendered as a native Circle on the map. Radius is in
// METERS (not pixels) — the Google Maps SDK scales it automatically with zoom.
// Tiles are 25m grid cells, so a 16m radius gives subtle overlap with neighbors,
// blending adjacent circles into organic blob shapes (no grid lines visible).
export const TILE_CIRCLE_RADIUS_M = 16;

// Warm amber, semi-transparent — visible against the dark map style above.
// Adjacent overlapping circles compound to a slightly brighter glow.
export const TILE_CIRCLE_FILL = "rgba(255, 200, 100, 0.55)";

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

// Base mist opacity layered over the dark map style.
// Keep low — patch circles stack additively, so the actual perceived
// opacity at the screen centre is much higher than any single value here.
export const CLOUD_BASE_OPACITY = 0.04;