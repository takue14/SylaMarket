interface Stop {
  lat: number;
  lng: number;
}

/**
 * Builds a Google Maps directions URL with multiple waypoints. Works as a
 * universal link — opens the Google Maps app if installed (iOS/Android),
 * falls back to Maps in a browser otherwise. Stops should already be in
 * the driver's intended visiting order (e.g. from OSRM's Trip API).
 */
export function buildGoogleMapsRouteUrl(origin: Stop, stops: Stop[]): string {
  if (stops.length === 0) return '';

  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1);

  const params = new URLSearchParams({
    api: '1',
    travelmode: 'driving',
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
  });

  if (waypoints.length > 0) {
    // Google's directions API supports up to 25 total waypoints
    params.set('waypoints', waypoints.map((w) => `${w.lat},${w.lng}`).join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}