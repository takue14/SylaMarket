interface RoutePoint {
  orderId: string;
  lat: number;
  lng: number;
  label: string;
}

interface OptimizedStop extends RoutePoint {
  order: number;
}

/**
 * Uses OSRM's public Trip service to find an efficient visiting order for
 * multiple delivery stops. Free, no API key — but rate-limited and meant
 * for testing/light use. For real production traffic, self-host OSRM or
 * switch to Mapbox/Google Directions (this function's signature would stay
 * the same, only the fetch URL and response parsing would change).
 */
export async function optimizeRoute(
  driverLat: number,
  driverLng: number,
  stops: RoutePoint[]
): Promise<OptimizedStop[]> {
  if (stops.length === 0) return [];
  if (stops.length === 1) return [{ ...stops[0], order: 0 }];

  const coords = [`${driverLng},${driverLat}`, ...stops.map((s) => `${s.lng},${s.lat}`)].join(';');
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Routing service unavailable.');
  const data = await res.json();

  if (data.code !== 'Ok') throw new Error('Could not compute a route for these stops.');

  // waypoints[0] is the driver's own start point — skip it, map the rest
  // back to the original stop data using OSRM's returned waypoint_index.
  const ordered = data.waypoints
    .slice(1)
    .map((wp: { waypoint_index: number }, i: number) => ({ ...stops[i], order: wp.waypoint_index }))
    .sort((a: OptimizedStop, b: OptimizedStop) => a.order - b.order);

  return ordered;
}