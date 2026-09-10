'use client';
import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ef4444', color: 'white', textAlign: 'center', padding: '8px 12px', fontSize: 13, fontWeight: 600, zIndex: 9998 }}>
      You're offline — some actions won't work until your connection is back.
    </div>
  );
}