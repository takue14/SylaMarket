interface RegionConfig {
  baseUrl: string;
  // Rough bounding box used to pick a region from coordinates alone —
  // doesn't need to be precise, just enough to disambiguate which
  // OSRM instance actually has road data for this point.
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

// Populate this from an env var so regions can be added without a
// code change — see the parsing function below.
function parseRegionsFromEnv(): Record<string, RegionConfig> {
  const raw = process.env.OSRM_REGIONS_JSON;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse OSRM_REGIONS_JSON:', err);
    return {};
  }
}

const REGIONS = parseRegionsFromEnv();
const FALLBACK_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

export function resolveOsrmBaseUrl(lat: number, lng: number): string {
  for (const region of Object.values(REGIONS)) {
    const { bounds } = region;
    if (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng) {
      return region.baseUrl;
    }
  }
  return FALLBACK_URL;
}