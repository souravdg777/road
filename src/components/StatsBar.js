import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStats } from '../lib/storage';

const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
};

export default function StatsBar({ isTracking, sessionDistance = 0, sessionTileCount = 0 }) {
  const [stats, setStats] = useState({ total_distance: 0, tile_count: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const s = await getStats();
      setStats(s);
    };
    loadStats();

    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh lifetime totals when tracking stops so the post-session view is accurate
  useEffect(() => {
    if (!isTracking) {
      getStats().then(setStats).catch(() => {});
    }
  }, [isTracking]);

  const distanceMeters = isTracking ? sessionDistance : stats.total_distance;
  const tileCount = isTracking ? sessionTileCount : stats.tile_count;
  const distLabel = isTracking ? "Session Dist" : "Distance";
  const tileLabel = isTracking ? "Session Tiles" : "Explored";

  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <Text style={styles.label}>{distLabel}</Text>
        <Text style={styles.value}>{formatDistance(distanceMeters)}</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.label}>{tileLabel}</Text>
        <Text style={styles.value}>{tileCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  label: { color: '#aaa', fontSize: 12 },
  value: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
