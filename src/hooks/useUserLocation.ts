'use client';
import { useState, useEffect } from 'react';
import { reverseGeocodeCountry } from '@/lib/geocoding';

export type LocationStatus = 'idle' | 'loading' | 'saved' | 'locating' | 'denied' | 'unsupported' | 'manual';

export function useUserLocation(customerId: string | null) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');

  useEffect(() => {
    if (!customerId) {
      setStatus('idle');
      return;
    }

    setStatus('loading');
    fetch(`/api/users/buyer/${customerId}/location`)
      .then((res) => res.json())
      .then((data) => {
        if (data.hasLocation) {
          // A location is already saved — use it as-is. Per the "only
          // auto-detect once, then require an explicit update" rule, we
          // never silently overwrite this.
          setCountry(data.country);
          if (data.coordinates) setCoords({ lat: data.coordinates[1], lng: data.coordinates[0] });
          setStatus('saved');
          return;
        }

        // Nothing saved yet — try to auto-detect once.
        if (!navigator.geolocation) {
          setStatus('unsupported');
          return;
        }
        setStatus('locating');
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            const geo = await reverseGeocodeCountry(c.lat, c.lng);
            if (geo?.country) {
              // Persist immediately so future visits load from the DB
              // instead of re-prompting.
              await fetch(`/api/users/buyer/${customerId}/location`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: geo.country, lat: c.lat, lng: c.lng }),
              }).catch(() => {});
              setCoords(c);
              setCountry(geo.country);
              setStatus('saved');
            } else {
              setStatus('denied'); // couldn't resolve a country — fall through to manual picker
            }
          },
          () => setStatus('denied'),
          { timeout: 8000 }
        );
      })
      .catch(() => setStatus('denied'));
  }, [customerId]);

  const setManualCountry = async (selectedCountry: string) => {
    setCountry(selectedCountry);
    setStatus('manual');
    if (customerId) {
      // Manual country-only entry has no coordinates for distance sort,
      // but we still persist the country so it's not re-prompted next visit.
      await fetch(`/api/users/buyer/${customerId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedCountry, lat: 0, lng: 0 }),
      }).catch(() => {});
    }
  };

  return { coords, country, status, setManualCountry };
}