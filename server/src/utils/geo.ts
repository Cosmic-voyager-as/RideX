import { Location } from '../domain/User';

/**
 * Computes great-circle distance between two geographic coordinates using the Haversine formula.
 * Returns distance in kilometers rounded to 2 decimal places.
 */
export function calculateHaversineDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);

  const lat1 = toRad(loc1.latitude);
  const lat2 = toRad(loc2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 100) / 100;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

