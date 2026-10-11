'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '@/context/NotificationContext';

interface HubLine {
  product: string;
  productName: string;
  quantity: number;
  itemStatus: string;
}
interface HubOrder {
  _id: string;
  fulfillment: string;
  createdAt: string;
  products: HubLine[];
}

const CHIP: Record<string, { text: string; color: string }> = {
  awaiting_seller: { text: 'Awaiting seller', color: '#9ca3af' },
  accepted: { text: 'Accepted', color: '#60a5fa' },
  preparing: { text: 'Preparing', color: '#60a5fa' },
  ready: { text: 'Ready at seller', color: '#f59e0b' },
  shipped: { text: 'On its way to hub', color: '#f59e0b' },
  at_hub: { text: 'At hub ✓', color: '#10b981' },
};

export default function AdminHubPage() {
  const { notify } = useNotification();
  const [orders, setOrders] = useState<HubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/hub');
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    const res = await fetch('/api/admin/hub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) notify(data.message || 'Action failed.', 'error');
    await load();
    setBusy(null);
  };

  const missing = (orderId: string, productId: string) => {
    const note = prompt('Optional note for the seller (why is it missing?):') ?? '';
    send({ orderId, productId, action: 'missing', note }, `${orderId}${productId}`);
  };

  if (loading) return <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 100px' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Dealo Hub</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
        Confirm each item physically arrived. When every item in an order is at the hub, sort it to release it to drivers.
      </p>
      <button onClick={load} style={ghostBtn}>Refresh</button>

      {orders.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>No hub orders in progress.</p>}

      {orders.map((o) => (
        <div key={o._id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 14, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Order #{o._id.slice(-6)}</strong>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleString()}</span>
          </div>

          {o.products.map((p) => {
            const chip = CHIP[p.itemStatus] ?? { text: p.itemStatus, color: '#9ca3af' };
            const key = `${o._id}${p.product}`;
            return (
              <div key={p.product} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid var(--border)', marginTop: 8 }}>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{p.productName} × {p.quantity}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: chip.color }}>{chip.text}</div>
                </div>
                {p.itemStatus === 'shipped' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button disabled={busy === key} onClick={() => send({ orderId: o._id, productId: p.product, action: 'receive' }, key)} style={greenBtn}>
                      Received
                    </button>
                    <button disabled={busy === key} onClick={() => missing(o._id, p.product)} style={redBtn}>
                      Missing
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {o.fulfillment === 'at_hub' && (
            <button disabled={busy === o._id} onClick={() => send({ orderId: o._id, action: 'sort' }, o._id)} style={{ ...greenBtn, width: '100%', marginTop: 12, padding: 12 }}>
              Sort and release to drivers
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

const ghostBtn: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' };
const greenBtn: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: 'none', background: '#10b981', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' };
const redBtn: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' };