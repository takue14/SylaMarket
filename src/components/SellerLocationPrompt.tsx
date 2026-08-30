'use client';

import { useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { reverseGeocodeCountry, forwardGeocode } from '@/lib/geocoding';

interface Props {
  sellerId: string;
  onSaved: () => void;
}

export default function SellerLocationPrompt({ sellerId, onSaved }: Props) {
  const { notify } = useNotification();
  const [locating, setLocating] = useState(false);
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<'choose' | 'detected' | 'manual'>('choose');

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      notify('Your browser does not support location sharing. Enter your address instead.', 'warning');
      setMode('manual');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        const geo = await reverseGeocodeCountry(c.lat, c.lng);
        if (geo?.country) setCountry(geo.country);
        setLocating(false);
        setMode('detected');
      },
      () => {
        notify('Location permission denied. Enter your address instead.', 'warning');
        setLocating(false);
        setMode('manual');
      },
      { timeout: 8000 }
    );
  };

  const handleGeocodeAddress = async () => {
    if (!address.trim()) {
      notify('Enter an address or city first.', 'error');
      return;
    }
    setGeocodingAddress(true);
    try {
      const result = await forwardGeocode(address.trim());
      if (!result) {
        notify('Could not find that address. Try adding a city and country.', 'error');
        return;
      }
      setCoords({ lat: result.lat, lng: result.lng });
      setCountry(result.country || country);
      notify('Location found — confirm below.', 'success');
    } catch {
      notify('Network error looking up that address.', 'error');
    } finally {
      setGeocodingAddress(false);
    }
  };

  const handleSave = async () => {
    if (!country.trim() || !coords) {
      notify('Confirm a country and location before saving.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/sellers/${sellerId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: country.trim(), lat: coords.lat, lng: coords.lng }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify('Location saved.', 'success');
        onSaved();
      } else {
        notify(data.message || 'Failed to save location.', 'error');
      }
    } catch {
      notify('Network error — please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      <h2 style={{ marginBottom: 8 }}>Set your business location</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        Buyers only see products from sellers in their own country, sorted by distance. Set your location to
        continue listing products.
      </p>

      {mode === 'choose' && (
        <>
          <button
            onClick={handleShareLocation}
            disabled={locating}
            style={btnStyle('#7c3aed')}
          >
            {locating ? 'Locating…' : 'Share my location'}
          </button>
          <button onClick={() => setMode('manual')} style={{ ...btnStyle('transparent'), color: '#7c3aed', border: '1px solid #7c3aed' }}>
            Enter my address manually
          </button>
        </>
      )}

      {mode === 'manual' && !coords && (
        <>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Harare, Zimbabwe or a street address"
            style={inputStyle}
          />
          <button onClick={handleGeocodeAddress} disabled={geocodingAddress} style={btnStyle('#7c3aed')}>
            {geocodingAddress ? 'Looking up…' : 'Find my location'}
          </button>
          <button onClick={() => setMode('choose')} style={{ ...btnStyle('transparent'), color: 'var(--text-muted)', fontSize: 13 }}>
            ← Back
          </button>
        </>
      )}

      {coords && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            Confirm your country before saving:
          </p>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Confirm your country"
            style={inputStyle}
          />
          <button onClick={handleSave} disabled={saving} style={btnStyle('#10b981')}>
            {saving ? 'Saving…' : 'Confirm & save'}
          </button>
          <button
            onClick={() => {
              setCoords(null);
              setMode('choose');
            }}
            style={{ ...btnStyle('transparent'), color: 'var(--text-muted)', fontSize: 13 }}
          >
            Start over
          </button>
        </>
      )}
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '12px 20px',
    borderRadius: 10,
    border: 'none',
    background: bg,
    color: bg === 'transparent' ? undefined : 'white',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 12,
    width: '100%',
  };
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #2c2c35',
  marginBottom: 12,
  fontSize: 14,
  boxSizing: 'border-box',
};