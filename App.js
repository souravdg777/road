import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import ExplorerMap from './src/components/MapView';
import StatsBar from './src/components/StatsBar';
import { useLocation } from './src/hooks/useLocation';
import { initDB } from './src/lib/storage';
import { ACTIVE_TILE_DURATION } from './src/lib/config';

export default function App() {
  const [activeTileId, setActiveTileId] = useState(null);
  const [newTile, setNewTile] = useState(null);
  const activeTileTimer = useRef(null);

  const handleNewTile = useCallback((id) => {
    setNewTile({ id, ts: Date.now() });
    setActiveTileId(id);
    if (activeTileTimer.current) clearTimeout(activeTileTimer.current);
    activeTileTimer.current = setTimeout(() => setActiveTileId(null), ACTIVE_TILE_DURATION);
  }, []);

  const { isTracking, startTracking, stopTracking, sessionDistance, sessionTileCount } =
    useLocation({ onNewTile: handleNewTile });

  useEffect(() => {
    initDB().catch(e => console.error("Failed to init DB", e));
    return () => {
      if (activeTileTimer.current) clearTimeout(activeTileTimer.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <ExplorerMap newTile={newTile} />
      <StatsBar
        isTracking={isTracking}
        sessionDistance={sessionDistance}
        sessionTileCount={sessionTileCount}
      />
      <View style={styles.controls}>
        <Button
          title={isTracking ? "Stop Exploring" : "Start Exploring"}
          onPress={isTracking ? stopTracking : startTracking}
          color={isTracking ? "red" : "green"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center'
  }
});
