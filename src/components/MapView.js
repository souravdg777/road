import React, { useState, useRef } from 'react';
import MapView, { Polygon } from 'react-native-maps';
import { getTilesInBounds } from '../lib/storage';
import { getTilePolygon } from '../lib/spatial';
import { debounce, MAX_TILES } from '../lib/utils';
import { UNEXPLORED_MAP_STYLE } from '../lib/config';

export default function ExplorerMap() {
  const [tiles, setTiles] = useState([]);
  const mapRef = useRef(null);

  // Fetch tiles with Debounce (500ms)
  const fetchTiles = async (region) => {
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

    getTilesInBounds(bounds, (rows) => {
      const safeRows = Array.isArray(rows) ? rows : [];
      const cappedRows = safeRows.slice(0, MAX_TILES);

      const polygons = cappedRows
        .filter((row) => row && typeof row.id === 'string' && row.id.length > 0)
        .map((row) => {
          const coords = getTilePolygon(row.id);
          if (!Array.isArray(coords) || coords.length < 3) return null;
          return {
            id: row.id,
            coords,
          };
        })
        .filter(Boolean);

      setTiles(polygons);
    });
  };

  const debouncedFetch = useRef(debounce(fetchTiles, 500)).current;

  const onRegionChange = (region) => {
    debouncedFetch(region);
  };

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
          strokeColor="rgba(0, 255, 255, 0.8)" // Cyan Glow
          strokeWidth={2}
          fillColor="rgba(0, 255, 255, 0.35)" 
        />
      ))}
    </MapView>
  );
}
