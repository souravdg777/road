import React, { useEffect } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import ExplorerMap from './src/components/MapView';
import StatsBar from './src/components/StatsBar';
import { useLocation } from './src/hooks/useLocation';
import { initDB } from './src/lib/storage';

export default function App() {
  const { isTracking, startTracking, stopTracking } = useLocation();

  useEffect(() => {
    initDB().catch(e => console.error("Failed to init DB", e));
  }, []);

  return (
    <View style={styles.container}>
      <ExplorerMap />
      <StatsBar />
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