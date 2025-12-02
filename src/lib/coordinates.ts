/**
 * Utility functions for coordinate manipulation
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Shifts coordinates eastward by a specified distance in meters
 * @param coords Original coordinates
 * @param metersEast Distance to shift east in meters (default: 171m)
 * @returns Shifted coordinates
 */
export function shiftCoordinatesEast(coords: Coordinates, metersEast: number = 171): Coordinates {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    console.warn('Invalid coordinates provided to shiftCoordinatesEast:', coords);
    return coords;
  }

  // Convert meters to degrees longitude
  // At latitude, 1 degree longitude = 111320 * cos(latitude in radians) meters
  const latitudeRadians = coords.lat * (Math.PI / 180);
  const metersPerDegreeLongitude = 111320 * Math.cos(latitudeRadians);
  const longitudeShift = metersEast / metersPerDegreeLongitude;

  const shiftedCoords = {
    lat: coords.lat, // Latitude stays the same for eastward shift
    lng: coords.lng + longitudeShift // Add to longitude for eastward movement
  };

  console.log(`Shifted coordinates ${metersEast}m east: (${coords.lat}, ${coords.lng}) → (${shiftedCoords.lat}, ${shiftedCoords.lng})`);
  
  return shiftedCoords;
}

/**
 * Gets the eastward shift distance from environment variables
 * @returns Distance in meters to shift east (default: 171)
 */
export function getEastShiftDistance(): number {
  const envValue = process.env.COORDINATE_EAST_SHIFT_METERS;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return 171; // Default 171 meters
}

/**
 * Checks if coordinate shifting is enabled
 * @returns true if coordinate shifting should be applied
 */
export function isCoordinateShiftEnabled(): boolean {
  const envValue = process.env.COORDINATE_SHIFT_ENABLED;
  return envValue !== 'false' && envValue !== '0'; // Enabled by default unless explicitly disabled
}

/**
 * Applies the configured eastward shift to coordinates if enabled
 * @param coords Original coordinates
 * @returns Shifted coordinates or original coordinates if shifting is disabled
 */
export function applyConfiguredShift(coords: Coordinates | null): Coordinates | null {
  if (!coords || !isCoordinateShiftEnabled()) {
    return coords;
  }

  const shiftDistance = getEastShiftDistance();
  return shiftCoordinatesEast(coords, shiftDistance);
}
