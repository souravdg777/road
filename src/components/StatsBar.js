import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStats } from '../lib/storage';

export default function StatsBar() {
  const [stats, setStats] = useState({ total_distance: 0, tile_count: 0 });

  useEffect(() => {
    // Fetch stats on mount
    const loadStats = async () => {
      const s = await getStats();
      setStats(s);
    };
    loadStats();

    // Optional: Poll stats every 5 seconds to update UI
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const distKm = (stats.total_distance / 1000).toFixed(2);

  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{distKm} km</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.label}>Explored</Text>
        <Text style={styles.value}>{stats.tile_count}</Text>
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