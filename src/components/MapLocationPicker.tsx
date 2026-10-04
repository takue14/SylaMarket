'use client';

import * as maplibregl from 'maplibre-gl';


import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import 'maplibre-gl/dist/maplibre-gl.css';
import styled from 'styled-components';

interface Props {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (result: { lat: number; lng: number; address: string }) => void;
  onCancel: () => void;
}

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function MapLocationPicker({ initialLat, initialLng, onConfirm, onCancel }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: initialLat ?? -17.8252,
    lng: initialLng ?? 31.0335, // Harare — a reasonable default centerpoint, adjust if most of your base is elsewhere
  });
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OPENFREEMAP_STYLE,
      center: [center.lng, center.lat],
      zoom: initialLat ? 15 : 5,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const updateCenter = async () => {
      const c = map.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });
      setLoadingAddress(true);
      const addr = await reverseGeocode(c.lat, c.lng);
      setAddress(addr);
      setLoadingAddress(false);
    };

    map.on('moveend', updateCenter);
    map.on('load', updateCenter);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const content = (
    <Overlay>
      <Panel>
        <Header>
          <h3>Set exact location</h3>
          <button onClick={onCancel} aria-label="Close">×</button>
        </Header>

        <MapArea ref={mapContainerRef} />
        <CenterPin>📍</CenterPin>

        <Footer>
          <AddressLine>{loadingAddress ? 'Finding address…' : address}</AddressLine>
          <ButtonRow>
            <SecondaryBtn type="button" onClick={useMyLocation} disabled={locating}>
              {locating ? 'Locating…' : 'Use my current location'}
            </SecondaryBtn>
            <PrimaryBtn
              type="button"
              onClick={() => onConfirm({ lat: center.lat, lng: center.lng, address })}
              disabled={loadingAddress}
            >
              Confirm this location
            </PrimaryBtn>
          </ButtonRow>
        </Footer>
       </Panel>
    </Overlay>
  );

  if (typeof document === 'undefined') return null; // SSR guard
  return createPortal(content, document.body);
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const Panel = styled.div`
  background: var(--bg-card);
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);

  h3 {
    margin: 0;
    font-size: 15px;
    color: var(--text-primary);
  }
  button {
    background: none;
    border: none;
    font-size: 22px;
    color: var(--text-muted);
    cursor: pointer;
    line-height: 1;
  }
`;

const MapArea = styled.div`
  position: relative;
  width: 100%;
  height: 360px;
`;

const CenterPin = styled.div`
  position: absolute;
  top: calc(50% + 60px); /* offsets MapArea's own top; sits centered on the map above */
  left: 50%;
  transform: translate(-50%, -100%);
  font-size: 32px;
  pointer-events: none;
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.4));
`;

const Footer = styled.div`
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AddressLine = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
`;

const SecondaryBtn = styled.button`
  flex: 1;
  padding: 11px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const PrimaryBtn = styled.button`
  flex: 1;
  padding: 11px;
  border-radius: 10px;
  border: none;
  background: #7c3aed;
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;