/**
 * Converts a react-native-maps region + screen dimensions into a fast pixel projector.
 *
 * Uses a flat linear projection — accurate enough for city-scale zoom levels (25m tiles)
 * and runs in microseconds with zero I/O.
 *
 * @param {object} region  — {latitude, longitude, latitudeDelta, longitudeDelta}
 * @param {object} dimensions — {width, height} in screen pixels
 * @returns {(lat: number, lng: number) => {x: number, y: number}}
 */
export function regionToProjector(region, { width, height }) {
  const westLng = region.longitude - region.longitudeDelta / 2;
  const northLat = region.latitude + region.latitudeDelta / 2;

  return (lat, lng) => ({
    x: ((lng - westLng) / region.longitudeDelta) * width,
    y: ((northLat - lat) / region.latitudeDelta) * height,
  });
}
