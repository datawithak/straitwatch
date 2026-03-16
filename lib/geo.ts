// Haversine distance in meters between two lat/lng points
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Project a position forward in time given speed (knots) and course (degrees)
export function projectPosition(
  lat: number,
  lng: number,
  sog: number, // knots
  cog: number, // degrees
  elapsedMs: number
): { lat: number; lng: number } {
  const elapsedHours = elapsedMs / 3600000;
  const distanceKm = sog * 1.852 * elapsedHours;
  const distanceRad = distanceKm / 6371;
  const bearingRad = (cog * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const newLat = Math.asin(
    Math.sin(latRad) * Math.cos(distanceRad) +
      Math.cos(latRad) * Math.sin(distanceRad) * Math.cos(bearingRad)
  );
  const newLng =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(distanceRad) * Math.cos(latRad),
      Math.cos(distanceRad) - Math.sin(latRad) * Math.sin(newLat)
    );

  return {
    lat: (newLat * 180) / Math.PI,
    lng: (newLng * 180) / Math.PI,
  };
}

// Check if a point is inside a bounding box
export function isInsideBounds(
  lat: number,
  lng: number,
  bounds: { lat_min: number; lat_max: number; lon_min: number; lon_max: number }
): boolean {
  return (
    lat >= bounds.lat_min &&
    lat <= bounds.lat_max &&
    lng >= bounds.lon_min &&
    lng <= bounds.lon_max
  );
}
