import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import { getTilesInBounds } from '../lib/storage';
import { getTileCenter } from '../lib/spatial';
import {
  MAX_TILES,
  UNEXPLORED_MAP_STYLE,
  TILE_CIRCLE_RADIUS_M,
  TILE_CIRCLE_FILL,
} from '../lib/config';

/**
 * ExplorerMap — base map with native Circle overlays for explored tiles.
 *
 * Architecture decision (2026-04-27):
 * Earlier attempts used either a Skia Canvas overlay or a sibling <View>
 * overlay containing fog/mist + tile blobs. Both failed:
 *   - Skia Canvas captured touches, breaking map pan/zoom.
 *   - Sibling Views were occluded on Android because react-native-maps
 *     renders to a SurfaceView, a separate native window. Views inside
 *     the same parent as MapView don't reliably composite on top.
 *
 * The fix: render explored tiles as native map features (Circle children
 * of MapView). They're drawn by the Google Maps SDK itself, so:
 *   - They render correctly on top of the map (they ARE the map)
 *   - They auto-pan/zoom with no manual projection math
 *   - Touches pass through (native map features don't capture gestures)
 *   - No View hierarchy z-order issues
 *
 * The "fog" feel comes from a dark map style — unexplored areas look dim,
 * bright warm circles on explored tiles pop visually. Dark = unexplored,
 * bright = where you've been.
 */
export default function ExplorerMap({ newTile }) {
  const [tiles, setTiles] = useState([]);
  const debounceTimer = useRef(null);
  // Mirror of tiles state — readable inside effects without stale closures
  const tilesRef = useRef([]);

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
      const rows = await getTilesInBounds(bounds);
      const safeRows = Array.isArray(rows) ? rows : [];
      const loaded = safeRows
        .slice(0, MAX_TILES)
        .filter(row => row?.id)
        .map(row => ({ id: row.id }));

      tilesRef.current = loaded;
      setTiles(loaded);
    } catch (e) {
      console.error('Error loading tiles', e);
    }
  }, []);

  // Debounce tile DB queries so we don't thrash SQLite while panning.
  const onRegionChange = useCallback((rgn) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => loadTiles(rgn), 300);
  }, [loadTiles]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Merge a newly-unlocked tile instantly (no DB re-query needed).
  useEffect(() => {
    if (!newTile?.id) return;
    if (tilesRef.current.some(t => t.id === newTile.id)) return;

    const updated = [...tilesRef.current, { id: newTile.id }];
    tilesRef.current = updated;
    setTiles(updated);
  }, [newTile]);

  // Pre-compute centers so each render isn't recomputing them per Circle.
  const tileCenters = useMemo(
    () => tiles.map(t => ({ id: t.id, ...getTileCenter(t.id) })),
    [tiles]
  );

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        customMapStyle={UNEXPLORED_MAP_STYLE}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={true}
      >
        {tileCenters.map(t => (
          <Circle
            key={t.id}
            center={{ latitude: t.latitude, longitude: t.longitude }}
            radius={TILE_CIRCLE_RADIUS_M}
            fillColor={TILE_CIRCLE_FILL}
            strokeColor="rgba(0,0,0,0)"
            strokeWidth={0}
          />
        ))}
      </MapView>
    </View>
  );
}
