import { Point, haversineKm } from './geo';

import { resolveOsrmBaseUrl } from './osrmRegions';
const CHUNK = 50; // keep each Table request well under public-server coordinate limits
const TTL_MS = 2 * 60 * 1000;

export interface RouteMetric {
  distanceKm: number;
  durationMin: number;
  source: 'osrm' | 'estimate';
}

const cache = new Map<string, { at: number; metric: RouteMetric }>();

function cacheKey(o: Point, d: Point) {
  // Origin rounded to ~110 m so tiny GPS jitter reuses the same result
  return `${o.lat.toFixed(3)},${o.lng.toFixed(3)}>${d.lat.toFixed(5)},${d.lng.toFixed(5)}`;
}

function estimate(o: Point, d: Point): RouteMetric {
  const km = haversineKm(o, d) * 1.3; // rough road-vs-straight-line factor
  return { distanceKm: km, durationMin: (km / 30) * 60, source: 'estimate' };
}

async function fetchTable(origin: Point, dests: Point[]): Promise<RouteMetric[]> {
  const base = resolveOsrmBaseUrl(origin.lat, origin.lng);
  const coords = [origin, ...dests].map((p) => `${p.lng},${p.lat}`).join(';');
  const destIdx = dests.map((_, i) => i + 1).join(';');
  const url = `${base}/table/v1/driving/${coords}?sources=0&destinations=${destIdx}&annotations=distance,duration`;
  
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: 'no-store' });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error(`OSRM code ${data.code}`);

    return dests.map((d, i) => {
      const meters = data.distances?.[0]?.[i];
      const seconds = data.durations?.[0]?.[i];
      if (typeof meters === 'number' && typeof seconds === 'number') {
        return { distanceKm: meters / 1000, durationMin: seconds / 60, source: 'osrm' as const };
      }
      return estimate(origin, d); // unroutable point — fall back per item
    });
  } catch (err) {
    console.error('OSRM table failed, using estimates:', err instanceof Error ? err.message : err);
    return dests.map((d) => estimate(origin, d));
  }
}

/** Road distance/time from one origin to many destinations (one OSRM call per 50). */
export async function driverToDestinations(origin: Point, dests: Point[]): Promise<RouteMetric[]> {
  const out: RouteMetric[] = new Array(dests.length);
  const misses: number[] = [];
  const now = Date.now();

  dests.forEach((d, i) => {
    const hit = cache.get(cacheKey(origin, d));
    if (hit && now - hit.at < TTL_MS) out[i] = hit.metric;
    else misses.push(i);
  });

  for (let s = 0; s < misses.length; s += CHUNK) {
    const idxs = misses.slice(s, s + CHUNK);
    const metrics = await fetchTable(origin, idxs.map((i) => dests[i]));
    idxs.forEach((destIndex, k) => {
      out[destIndex] = metrics[k];
      if (metrics[k].source === 'osrm') cache.set(cacheKey(origin, dests[destIndex]), { at: now, metric: metrics[k] });
    });
  }
  return out;
}