import { useState, useRef } from 'react';
import * as Location from 'expo-location';
import { getTileId } from '../lib/spatial';
import { saveTile } from '../lib/storage';
import { calcDistance } from '../lib/utils';
import { MIN_UPDATE_TIME, MIN_UPDATE_DISTANCE, JUMP_THRESHOLD } from '../lib/config';

export const useLocation = () => {
  const [isTracking, setIsTracking] = useState(false);
  const subscription = useRef(null);
  const lastPosition = useRef(null);
  const lastTime = useRef(0);
  
  // 3. In-memory Deduplication
  const lastTileCache = useRef(null); 

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Location permission denied.');
      return false;
    }
    return true;
  };

  const startTracking = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsTracking(true);
    lastTileCache.current = null; // Reset on start

    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 1000 },
      (location) => {
        const { latitude, longitude } = location.coords;
        const now = Date.now();

        // Sanity Check: Jump Threshold
        if (lastPosition.current) {
          const dist = calcDistance(lastPosition.current, { latitude, longitude });
          if (dist > JUMP_THRESHOLD) return;
        }

        // Throttle: Time & Distance
        if (now - lastTime.current < MIN_UPDATE_TIME) return;
        if (lastPosition.current && calcDistance(lastPosition.current, { latitude, longitude }) < MIN_UPDATE_DISTANCE) return;

        // Process Movement
        const tileId = getTileId(latitude, longitude);

        // 3. Dedup Check: Only write if tile changed
        if (lastTileCache.current !== tileId) {
           saveTile(tileId).catch(e => console.log("Save error", e)); // Fire & forget
           lastTileCache.current = tileId;
        }

        // Update Refs
        lastPosition.current = { latitude, longitude };
        lastTime.current = now;
      }
    );
  };

  const stopTracking = () => {
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
    setIsTracking(false);
    lastTileCache.current = null;
  };

  return { isTracking, startTracking, stopTracking };
};