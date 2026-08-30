'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { reverseGeocodeCountry, forwardGeocode } from '@/lib/geocoding';

type Role = 'seller' | 'buyer' | 'delivery';

interface Props {
  role: Role;
  userId: string;
}

export default function LocationSettings({ role, userId }: Props) {
  const { notify } = useNotification();
  const [savedCountry, setSavedCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [locating, setLocating] = useState(false);
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<'choose' | 'manual'>('choose');

  useEffect(() => {
    fetch(`/api/users/${role}/${userId}/location`)
      .then((res) => res.json())
      .then((data) => setSavedCountry(data.country))
      .finally(() => setLoading(false));
  }, [role, userId]);

  const startEditing = () => {
    setEditing(true);
    setMode('choose');
    setCoords(null);
    setCountry('');
    setAddress('');
  };

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
      const res = await fetch(`/api/users/${role}/${userId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: country.trim(), lat: coords.lat, lng: coords.lng }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify('Location updated.', 'success');
        setSavedCountry(country.trim());
        setEditing(false);
      } else {
        notify(data.message || 'Failed to update location.', 'error');
      }
    } catch {
      notify('Network error — please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div style={card}>
      <style>{markerStyles}</style>

      {!editing && (
        <>
          <div style={eyebrow}>Current location</div>
          <div style={valueRow}>
            <span className="value-marker" />
            <span style={valueText}>{savedCountry || 'Not set'}</span>
          </div>
          <button onClick={startEditing} style={btnPrimary}>
            {savedCountry ? 'Update location' : 'Set location'}
          </button>
        </>
      )}

      {editing && (
        <>
          <div style={eyebrow}>{coords ? 'Confirm your country' : 'Find your location'}</div>

          {mode === 'choose' && !coords && (
            <>
              <button onClick={handleShareLocation} disabled={locating} style={btnPrimary}>
                {locating ? (
                  <span style={loadingRow}>
                    <span className="mini-marker" />
                    Locating…
                  </span>
                ) : (
                  'Share my current location'
                )}
              </button>
              <button onClick={() => setMode('manual')} style={btnGhost}>
                Enter address manually
              </button>
            </>
          )}

          {mode === 'manual' && !coords && (
            <>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Harare, Zimbabwe"
                style={input}
              />
              <button onClick={handleGeocodeAddress} disabled={geocodingAddress} style={btnPrimary}>
                {geocodingAddress ? (
                  <span style={loadingRow}>
                    <span className="mini-marker" />
                    Looking up…
                  </span>
                ) : (
                  'Find location'
                )}
              </button>
            </>
          )}

          {coords && (
            <>
              <div style={descriptionText}>We found a match — you can edit the country name before saving.</div>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                style={input}
              />
              <button onClick={handleSave} disabled={saving} style={btnSuccess}>
                {saving ? 'Saving…' : 'Save location'}
              </button>
            </>
          )}

          <button onClick={() => setEditing(false)} style={btnGhost}>
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

/* ---------- design tokens, matched to the onboarding screens ---------- */

const card: React.CSSProperties = {
  maxWidth: 380,
  padding: '16px 18px',
  background: 'var(--bg-card)',
  borderRadius: 20,
  fontFamily: "'Poppins', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  boxShadow: 'var(--shadow, 0 12px 30px rgba(20, 20, 40, 0.06))',
};

const eyebrow: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: 6,
};

const valueRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 12,
};

const valueText: React.CSSProperties = {
  fontSize: 19,
  fontWeight: 600,
  color: 'var(--text-primary)',
  lineHeight: 1,
};

const descriptionText: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--text-muted)',
  marginBottom: 10,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'var(--bg-input, var(--bg-card))',
  marginBottom: 8,
  fontSize: 14,
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const btnBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: 999,
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
  marginBottom: 8,
  fontSize: 14,
  fontFamily: 'inherit',
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: 'var(--accent, #4a5bd0)',
  color: '#ffffff',
};

const btnSuccess: React.CSSProperties = {
  ...btnBase,
  background: '#22a06b',
  color: '#ffffff',
};

const btnGhost: React.CSSProperties = {
  ...btnBase,
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  marginBottom: 0,
};

const loadingRow: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};

/* Small red animated marker sized to sit inline with the location text (19px) */
const markerStyles = `
  .value-marker {
    width: 16px;
    height: 16px;
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  .value-marker::after {
    content: '';
    width: 16px;
    height: 16px;
    left: 0;
    bottom: 0;
    position: absolute;
    border-radius: 50% 50% 0;
    border: 5px solid red;
    transform: rotate(45deg) translate(0, 0);
    box-sizing: border-box;
    animation: valueMarkerBounce 0.4s ease-in-out infinite alternate;
  }
  @keyframes valueMarkerBounce {
    0% { transform: rotate(45deg) translate(1.5px, 1.5px); }
    100% { transform: rotate(45deg) translate(-1.5px, -1.5px); }
  }

  .mini-marker {
    width: 18px;
    height: 18px;
    display: inline-block;
    position: relative;
    box-sizing: border-box;
  }
  .mini-marker::after {
    content: '';
    width: 18px;
    height: 18px;
    left: 0;
    bottom: 0;
    position: absolute;
    border-radius: 50% 50% 0;
    border: 6px solid red;
    transform: rotate(45deg) translate(0, 0);
    box-sizing: border-box;
    animation: miniMarkerBounce 0.4s ease-in-out infinite alternate;
  }
  @keyframes miniMarkerBounce {
    0% { transform: rotate(45deg) translate(2px, 2px); }
    100% { transform: rotate(45deg) translate(-2px, -2px); }
  }
`;