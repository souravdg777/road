import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import MapView, { Polygon, Polyline } from 'react-native-maps';
import { getTilesInBounds, getAllPathPoints } from '../lib/storage';
import { getTileCenter } from '../lib/spatial';
import {
  MAX_TILES,
  UNEXPLORED_MAP_STYLE,
  FOG_COLOR,
  TILE_HOLE_RADIUS_DEG,
  TILE_HOLE_POINTS,
  TRAIL_OUTER_COLOR,
  TRAIL_OUTER_WIDTH,
  TRAIL_INNER_COLOR,
  TRAIL_INNER_WIDTH,
} from '../lib/config';

// ─── Geometry helpers ────────────────────────────────────────────────────────

/**
 * Returns TILE_HOLE_POINTS lat/lng coordinates forming a polygon that
 * approximates a circle. Used as a hole in the fog Polygon to reveal the
 * map beneath each explored tile.
 */
function circleHole(lat, lng) {
  return Array.from({ length: TILE_HOLE_POINTS }, (_, i) => {
    const angle = (2 * Math.PI * i) / TILE_HOLE_POINTS;
    return {
      latitude:  lat + TILE_HOLE_RADIUS_DEG * Math.cos(angle),
      longitude: lng + TILE_HOLE_RADIUS_DEG * Math.sin(angle),
    };
  });
}

/**
 * Returns 4 corners of a bounding rectangle covering the visible region
 * with generous padding — fog edges never peek into view during a pan.
 */
function fogBounds(region) {
  const latPad = region.latitudeDelta  * 1.5;
  const lngPad = region.longitudeDelta * 1.5;
  const N = region.latitude  + region.latitudeDelta  / 2 + latPad;
  const S = region.latitude  - region.latitudeDelta  / 2 - latPad;
  const E = region.longitude + region.longitudeDelta / 2 + lngPad;
  const W = region.longitude - region.longitudeDelta / 2 - lngPad;
  return [
    { latitude: N, longitude: W },
    { latitude: N, longitude: E },
    { latitude: S, longitude: E },
    { latitude: S, longitude: W },
  ];
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ExplorerMap
 *
 * Fog-of-war via two native react-native-maps overlays:
 *
 *   Polygon fog  — dark rect covering the viewport with circular holes at
 *                  every explored tile, revealing the map beneath.
 *   Polyline trail — exact GPS path as a glowing worm (two stacked lines:
 *                  thick dim outer halo + thin bright inner core).
 *
 * All overlays are native map features: they auto-pan/zoom, never block
 * touches, and have no SurfaceView z-order issues.
 *
 * Props:
 *   newTile     — {id, ts} | null
 *   sessionPath — [{latitude, longitude}] — live GPS fixes this session
 */
export default function ExplorerMap({ newTile, sessionPath = [] }) {
  const [tiles, setTiles]   = useState([]);
  const [region, setRegion] = useState(null);
  const [dbPath, setDbPath] = useState([]);
  const debounceTimer       = useRef(null);
  const tilesRef            = useRef([]);

  // Load full historical path from DB once on mount.
  // sessionPath (prop) extends it in real time with zero latency.
  useEffect(() => {
    getAllPathPoints()
      .then(pts => setDbPath(pts))
      .catch(e => console.error('Error loading path', e));
  }, []);

  const loadTiles = useCallback(async (rgn) => {
    if (!rgn) return;
    const bounds = {
      northEast: {
        latitude:  rgn.latitude + rgn.latitudeDelta  / 2,
        longitude: rgn.longitude + rgn.longitudeDelta / 2,
      },
      southWest: {
        latitude:  rgn.latitude - rgn.latitudeDelta  / 2,
        longitude: rgn.longitude - rgn.longitudeDelta / 2,
      },
    };
    try {
      const rows    = await getTilesInBounds(bounds);
      const safeRows = Array.isArray(rows) ? rows : [];
      const loaded  = safeRows
        .slice(0, MAX_TILES)
        .filter(row => row?.id)
        .map(row => ({ id: row.id }));
      tilesRef.current = loaded;
      setTiles(loaded);
    } catch (e) {
      console.error('Error loading tiles', e);
    }
  }, []);

  const onRegionChange = useCallback((rgn) => {
    setRegion(rgn);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => loadTiles(rgn), 300);
  }, [loadTiles]);

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  // Merge a newly-unlocked tile instantly — no DB re-query needed.
  useEffect(() => {
    if (!newTile?.id) return;
    if (tilesRef.current.some(t => t.id === newTile.id)) return;
    const updated = [...tilesRef.current, { id: newTile.id }];
    tilesRef.current = updated;
    setTiles(updated);
  }, [newTile]);

  // One circle hole per explored tile.
  const fogHoles = useMemo(() => {
    return tiles.map(tile => {
      const { latitude, longitude } = getTileCenter(tile.id);
      return circleHole(latitude, longitude);
    });
  }, [tiles]);

  const fogCoords = useMemo(() => {
    if (!region) return null;
    return fogBounds(region);
  }, [region]);

  // DB history + live session = full trail in correct order.
  const fullTrail = useMemo(
    () => [...dbPath, ...sessionPath],
    [dbPath, sessionPath]
  );

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        customMapStyle={UNEXPLORED_MAP_STYLE}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={true}
      >
        {/* Fog of war — dark overlay with holes at explored tiles */}
        {fogCoords && (
          <Polygon
            coordinates={fogCoords}
            holes={fogHoles}
            fillColor={FOG_COLOR}
            strokeColor="rgba(0,0,0,0)"
            strokeWidth={0}
          />
        )}

        {/* GPS trail — outer glow halo */}
        {fullTrail.length >= 2 && (
          <Polyline
            coordinates={fullTrail}
            strokeColor={TRAIL_OUTER_COLOR}
            strokeWidth={TRAIL_OUTER_WIDTH}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* GPS trail — inner bright core */}
        {fullTrail.length >= 2 && (
          <Polyline
            coordinates={fullTrail}
            strokeColor={TRAIL_INNER_COLOR}
            strokeWidth={TRAIL_INNER_WIDTH}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>
    </View>
  );
}
