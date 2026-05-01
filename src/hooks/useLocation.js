import { useState, useRef } from 'react';
import * as Location from 'expo-location';
import { getTileId } from '../lib/spatial';
import { saveTile, savePathPoint, incrementDistance } from '../lib/storage';
import { calcDistance } from '../lib/utils';
import { MIN_UPDATE_TIME, MIN_UPDATE_DISTANCE, JUMP_THRESHOLD } from '../lib/config';

export const useLocation = ({ onNewTile, onDistance } = {}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [sessionDistance, setSessionDistance] = useState(0);
  const [sessionTileCount, setSessionTileCount] = useState(0);
  // In-memory ordered GPS fixes for this session — extends the DB path
  // with zero lag so the live tip of the trail updates instantly.
  const [sessionPath, setSessionPath] = useState([]);
  const subscription = useRef(null);
  const lastPosition = useRef(null);
  const lastTime = useRef(0);
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
    setSessionDistance(0);
    setSessionTileCount(0);
    setSessionPath([]);
    lastTileCache.current = null;
    lastPosition.current = null;
    lastTime.current = 0;

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

        let movedDistance = 0;
        if (lastPosition.current) {
           movedDistance = calcDistance(lastPosition.current, { latitude, longitude });
           if (movedDistance < MIN_UPDATE_DISTANCE) return;
        }

        // --- Update Stats, Path & Tiles ---

        // 1. Save exact GPS point to path (fire and forget)
        savePathPoint(latitude, longitude).catch(e => console.log("Path error", e));
        setSessionPath(p => [...p, { latitude, longitude }]);

        // 2. Update Distance
        if (movedDistance > 0) {
           incrementDistance(movedDistance).catch(e => console.log("Stat error", e));
           setSessionDistance(d => d + movedDistance);
           onDistance?.(movedDistance);
        }

        // 3. Update Tiles
        const tileId = getTileId(latitude, longitude);
        if (lastTileCache.current !== tileId) {
           saveTile(tileId).catch(e => console.log("Save error", e));
           lastTileCache.current = tileId;
           setSessionTileCount(c => c + 1);
           onNewTile?.(tileId);
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

  return { isTracking, startTracking, stopTracking, sessionDistance, sessionTileCount, sessionPath };
};
