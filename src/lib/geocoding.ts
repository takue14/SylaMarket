export interface GeocodeResult {
  country: string;
  countryCode: string;
}

/**
 * Reverse-geocodes coordinates to a country using OpenStreetMap's Nominatim.
 * Free, no API key — but has a strict 1 req/sec rate limit and requires a
 * descriptive User-Agent per their usage policy. Callers should cache the
 * result (see useUserLocation.ts) rather than calling this repeatedly.
 */
export async function reverseGeocodeCountry(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=3`,
      { headers: { 'User-Agent': 'Dealo-Marketplace/1.0 (contact: chigwayataku@gmail.com)' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.address?.country) return null;
    return {
      country: data.address.country,
      countryCode: data.address.country_code?.toUpperCase() || '',
    };
  } catch {
    return null;
  }
}

/**
 * Forward-geocodes a free-text address to coordinates + country. Used at
 * seller registration when they type an address instead of sharing live
 * location.
 */
export async function forwardGeocode(address: string): Promise<{ lat: number; lng: number; country: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
      { headers: { 'User-Agent': 'Dealo-Marketplace/1.0 (contact: chigwayataku@gmail.com)' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[0]) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      country: data[0].address?.country || '',
    };
  } catch {
    return null;
  }
}