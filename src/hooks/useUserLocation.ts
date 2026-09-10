'use client';
import { useState, useEffect } from 'react';
import { reverseGeocodeCountry } from '@/lib/geocoding';

export type LocationStatus = 'idle' | 'loading' | 'saved' | 'locating' | 'denied' | 'unsupported' | 'manual';

const GUEST_LOCATION_KEY = 'guestLocation';

export function useUserLocation(customerId: string | null) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');

  useEffect(() => {
    let cancelled = false;

    function detectBrowserLocation(onResolved: (c: { lat: number; lng: number }, country: string) => void) {
      if (!navigator.geolocation) {
        if (!cancelled) setStatus('unsupported');
        return;
      }
      if (!cancelled) setStatus('locating');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const geo = await reverseGeocodeCountry(c.lat, c.lng);
          if (cancelled) return;
          if (geo?.country) {
            onResolved(c, geo.country);
          } else {
            setStatus('denied');
          }
        },
        () => {
          if (!cancelled) setStatus('denied');
        },
        { timeout: 8000 }
      );
    }

    // ---- Guest path: no account, use sessionStorage ----
    if (!customerId) {
      const cached = sessionStorage.getItem(GUEST_LOCATION_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setCountry(parsed.country ?? null);
          if (parsed.coords) setCoords(parsed.coords);
          setStatus('saved');
          return;
        } catch {
          // fall through to fresh detection
        }
      }
      detectBrowserLocation((c, resolvedCountry) => {
        sessionStorage.setItem(GUEST_LOCATION_KEY, JSON.stringify({ coords: c, country: resolvedCountry }));
        setCoords(c);
        setCountry(resolvedCountry);
        setStatus('saved');
      });
      return;
    }

    // ---- Logged-in path: check the account first, only detect if unset ----
    setStatus('loading');
    fetch(`/api/users/buyer/${customerId}/location`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.hasLocation) {
          setCountry(data.country);
          if (data.coordinates) setCoords({ lat: data.coordinates[1], lng: data.coordinates[0] });
          setStatus('saved');
          return;
        }
        detectBrowserLocation(async (c, resolvedCountry) => {
          await fetch(`/api/users/buyer/${customerId}/location`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country: resolvedCountry, lat: c.lat, lng: c.lng }),
          }).catch(() => {});
          setCoords(c);
          setCountry(resolvedCountry);
          setStatus('saved');
        });
      })
      .catch(() => {
        if (!cancelled) setStatus('denied');
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const setManualCountry = async (selectedCountry: string) => {
    setCountry(selectedCountry);
    setStatus('manual');
    if (customerId) {
      await fetch(`/api/users/buyer/${customerId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedCountry, lat: 0, lng: 0 }),
      }).catch(() => {});
    } else {
      sessionStorage.setItem(GUEST_LOCATION_KEY, JSON.stringify({ coords: null, country: selectedCountry }));
    }
  };

  return { coords, country, status, setManualCountry };
}