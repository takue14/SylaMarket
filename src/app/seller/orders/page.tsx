'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';

interface Line {
  product: string;
  seller: string;
  productName: string;
  quantity: number;
  itemStatus: string;
}
interface SellerOrder {
  _id: string;
  fulfillment: string;
  fulfillmentMode: 'hub' | 'direct';
  createdAt: string;
  products: Line[];
}

const NEXT: Record<string, { action: string; label: string }> = {
  awaiting_seller: { action: 'accept', label: 'Accept order' },
  accepted: { action: 'prepare', label: 'Start preparing' },
  preparing: { action: 'ready', label: 'Mark ready' },
  ready: { action: 'ship', label: 'Ship to Dealo hub' },
};

const STATUS_TEXT: Record<string, string> = {
  awaiting_seller: 'Waiting for you to accept',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  shipped: 'Shipped — waiting for hub to confirm',
  at_hub: 'Received at hub',
};

export default function SellerOrdersPage() {
  const { notify } = useNotification();
  const router = useRouter();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/orders?as=seller');
    if (res.status === 401) {
      router.push('/auth?role=seller&mode=signin');
      return;
    }
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    setSellerId(localStorage.getItem('sellerId'));
    load();
  }, [load]);

  const act = async (orderId: string, action: string) => {
    setBusy(orderId);
    const res = await fetch('/api/seller/orders/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) notify(data.message || 'Could not update the order.', 'error');
    await load();
    setBusy(null);
  };

  if (loading) return <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</p>;

  const visible = orders.filter((o) => showDone || !['delivered', 'settled'].includes(o.fulfillment));

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 100px' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Orders to fulfil</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
        Accept, prepare and mark items ready. Hub orders then ship to the Dealo hub. Instant orders are collected by a driver.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <label style={{ color: 'var(--text-primary)', fontSize: 13 }}>
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show completed
        </label>
        <button onClick={load} style={ghostBtn}>Refresh</button>
      </div>

      {visible.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No orders right now.</p>}

      {visible.map((o) => {
        const mine = o.products.filter((p) => String(p.seller) === sellerId);
        if (mine.length === 0) return null;
        const status = mine[0].itemStatus;
        const instant = o.fulfillmentMode === 'direct';
        const next = NEXT[status];
        const canAct = next && !(next.action === 'ship' && instant);

        return (
          <div key={o._id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Order #{o._id.slice(-6)}</strong>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: instant ? 'rgba(245,158,11,0.15)' : 'rgba(91,108,255,0.15)',
                  color: instant ? '#f59e0b' : '#5b6cff',
                }}
              >
                {instant ? '⚡ INSTANT' : 'HUB'}
              </span>
            </div>

            <div style={{ margin: '10px 0' }}>
              {mine.map((p) => (
                <div key={p.product} style={{ fontSize: 13, color: 'var(--text-primary)', padding: '2px 0' }}>
                  {p.productName} × {p.quantity}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              {STATUS_TEXT[status] ?? status}
              {instant && status === 'ready' && ' — a driver will collect it from you'}
            </div>

            {canAct && (
              <button disabled={busy === o._id} onClick={() => act(o._id, next.action)} style={primaryBtn}>
                {busy === o._id ? 'Working…' : next.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

const primaryBtn: React.CSSProperties = { width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' };