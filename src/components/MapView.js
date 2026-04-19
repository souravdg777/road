import React, { useEffect, useState, useRef, useCallback } from 'react';
import MapView, { Polygon } from 'react-native-maps';
import { getTilesInBounds } from '../lib/storage';
import { getTilePolygon } from '../lib/spatial';
import { MAX_TILES } from '../lib/config';
import { UNEXPLORED_MAP_STYLE } from '../lib/config';

export default function ExplorerMap() {
  const [tiles, setTiles] = useState([]);
  const mapRef = useRef(null);
  const debounceTimer = useRef(null);

  // 5. Debounced Fetch Logic
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
      // Direct async call
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
    // Clear previous timer
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    // Set new timer (~300ms)
    debounceTimer.current = setTimeout(() => {
      loadTiles(region);
    }, 300);
  };

  useEffect(() => {
    // Cleanup debounce on unmount
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      customMapStyle={UNEXPLORED_MAP_STYLE}
      onRegionChangeComplete={onRegionChange}
      showsUserLocation={true}
    >
      {tiles.map(tile => (
        <Polygon
          key={tile.id}
          coordinates={tile.coords.map(c => ({ latitude: c[0], longitude: c[1] }))}
          strokeColor="rgba(0, 255, 255, 0.8)" 
          strokeWidth={2}
          fillColor="rgba(0, 255, 255, 0.35)" 
        />
      ))}
    </MapView>
  );
}