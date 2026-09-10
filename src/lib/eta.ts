function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const AVERAGE_SPEED_KMH = 30; // rough city-delivery assumption

export function estimateDeliveryMinutes(
  sellerLat: number,
  sellerLng: number,
  destLat: number,
  destLng: number
): number {
  const km = haversineKm(sellerLat, sellerLng, destLat, destLng);
  const hours = km / AVERAGE_SPEED_KMH;
  return Math.max(15, Math.round(hours * 60)); // never quote less than 15 min
}