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

// ─── Fog of War (native Polygon overlay) ─────────────────────────────────────
// A dark Polygon covers the entire visible region. Circular holes are punched
// at each explored tile, revealing the map underneath.
export const FOG_COLOR = 'rgba(15, 20, 30, 0.78)';

// Hole radius in degrees. GRID_SIZE = 0.0002 deg (~22m). Using 1.15× so
// adjacent tile holes overlap slightly — they merge into organic blobs.
export const TILE_HOLE_RADIUS_DEG = 0.00023;

// Points used to approximate each circular hole as a polygon.
// 24 gives smooth curves; fewer = faceted, more = diminishing returns.
export const TILE_HOLE_POINTS = 24;

// ─── GPS Trail (native Polyline) ─────────────────────────────────────────────
// Two stacked Polylines create a glow effect:
//   outer: thick, dim — the bloom halo
//   inner: thin, bright — the core light
export const TRAIL_OUTER_COLOR = 'rgba(255, 190, 60, 0.35)';
export const TRAIL_OUTER_WIDTH = 14;
export const TRAIL_INNER_COLOR = 'rgba(255, 230, 140, 0.95)';
export const TRAIL_INNER_WIDTH = 4;

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