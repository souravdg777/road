import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View } from 'react-native';
import MapView from 'react-native-maps';
import { getTilesInBounds } from '../lib/storage';
import { MAX_TILES, UNEXPLORED_MAP_STYLE } from '../lib/config';
import CloudOverlay from './CloudOverlay';

export default function ExplorerMap({ newTile }) {
  const [tiles, setTiles] = useState([]);
  const [region, setRegion] = useState(null);
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

  // Debounce tile DB queries; update region state immediately for CloudOverlay.
  const onRegionChange = useCallback((rgn) => {
    setRegion(rgn);
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

  return (
    <View style={{ flex: 1 }} pointerEvents="box-none">
      {/* Base map — pan/zoom/gestures/user dot live here */}
      <MapView
        style={{ flex: 1 }}
        customMapStyle={UNEXPLORED_MAP_STYLE}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={true}
      />

      {/*
        Skia fog overlay — must be a sibling of MapView, not a child.
        A Skia Canvas cannot render inside react-native-maps' native layer.

        pointerEvents="box-none" on the parent View ensures touches pass
        through to the MapView beneath, while Canvas still renders on top.
      */}
      <CloudOverlay
        tiles={tiles}
        newTile={newTile}
        region={region}
      />
    </View>
  );
}
