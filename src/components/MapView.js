import React, { useEffect, useState, useRef, useCallback } from 'react';
import MapView, { Polygon } from 'react-native-maps';
import { getTilesInBounds } from '../lib/storage';
import { getTilePolygon } from '../lib/spatial';
import { MAX_TILES } from '../lib/config';
import { UNEXPLORED_MAP_STYLE } from '../lib/config';

export default function ExplorerMap({ activeTileId, newTile }) {
  const [tiles, setTiles] = useState([]);
  const mapRef = useRef(null);
  const debounceTimer = useRef(null);

  const loadTiles = useCallback(async (region) => {
    if (!region) return;

    const bounds = {
      northEast: {
        latitude: region.latitude + (region.latitudeDelta / 2),
        longitude: region.longitude + (region.longitudeDelta / 2)
      },
      southWest: {
        latitude: region.latitude - (region.latitudeDelta / 2),
        longitude: region.longitude - (region.longitudeDelta / 2)
      }
    };

    try {
      const rows = await getTilesInBounds(bounds);

      const safeRows = Array.isArray(rows) ? rows : [];
      const cappedRows = safeRows.slice(0, MAX_TILES);

      const polygons = cappedRows
        .filter((row) => row && row.id)
        .map((row) => ({
          id: row.id,
          coords: getTilePolygon(row.id)
        }));

      setTiles(polygons);
    } catch (e) {
      console.error("Error loading tiles", e);
    }
  }, []);

  const onRegionChange = (region) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      loadTiles(region);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Merge newly-unlocked tile instantly without DB re-query
  useEffect(() => {
    if (!newTile?.id) return;
    setTiles(prev => {
      if (prev.some(t => t.id === newTile.id)) return prev;
      return [...prev, { id: newTile.id, coords: getTilePolygon(newTile.id) }];
    });
  }, [newTile]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      customMapStyle={UNEXPLORED_MAP_STYLE}
      onRegionChangeComplete={onRegionChange}
      showsUserLocation={true}
    >
      {tiles.map(tile => {
        const isActive = tile.id === activeTileId;
        return (
          <Polygon
            key={tile.id}
            coordinates={tile.coords.map(c => ({ latitude: c[0], longitude: c[1] }))}
            strokeColor={isActive ? "rgba(255, 200, 0, 1)" : "rgba(0, 255, 255, 0.8)"}
            strokeWidth={isActive ? 3 : 2}
            fillColor={isActive ? "rgba(255, 200, 0, 0.55)" : "rgba(0, 255, 255, 0.35)"}
          />
        );
      })}
    </MapView>
  );
}
