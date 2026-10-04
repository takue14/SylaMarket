export interface Point {
  lat: number;
  lng: number;
}

export function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Validates untrusted lat/lng input; returns null if unusable. */
export function toPoint(lat: unknown, lng: unknown): Point | null {
  const la = typeof lat === 'string' ? parseFloat(lat) : lat;
  const ln = typeof lng === 'string' ? parseFloat(lng) : lng;
  if (typeof la !== 'number' || typeof ln !== 'number' || isNaN(la) || isNaN(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}